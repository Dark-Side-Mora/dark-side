import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class OrganizationService {
  // Common method to create a project and link repo data
  async createProjectWithRepo(userId: string, dto: any) {
    console.log('Creating project with DTO:', dto);
    // Create the project
    const project = await this.prisma.project.create({
      data: {
        organizationId: dto.organizationId,
        name: dto.name,
        provider: dto.provider,
        repositoryUrl: dto.repositoryUrl,
        userId,
      },
    });

    // Link repo data based on provider
    if (dto.provider === 'github' && dto.repoData) {
      //data are there, just need to update the project id
      await this.prisma.gitHubRepository.update({
        data: {
          projectId: project.id,
        },
        where: {
          id: dto.repoData.id,
        },
      });
    }
    // Add other providers here (e.g., gitlab)

    return project;
  }
  // Fetch all projects under an organization, including actual repo details
  async getProjectsWithRepo(orgId: string) {
    // Get projects for the organization
    const projects = await this.prisma.project.findMany({
      where: { organizationId: orgId },
      include: {
        githubRepositories: true, // For provider 'github'
        // Add other provider repo includes here (e.g., gitlabRepositories)
      },
    });
    return projects;
  }
  constructor(private prisma: PrismaService) {}

  async getOrganizationsForUser(userId: string) {
    // Return organizations the user is a member of, with role
    const memberships = await this.prisma.organizationMembership.findMany({
      where: { userId },
      include: { organization: true },
    });
    return memberships.map((m) => ({
      id: m.organization.id,
      name: m.organization.name,
      domain: m.organization.domain,
      role: m.role,
    }));
  }

  async createOrganization(ownerId: string, name: string, domain: string) {
    if (!name || !domain) {
      throw new ForbiddenException('Organization name and domain are required');
    }
    // Check for duplicate org name/domain
    const existing = await this.prisma.organization.findFirst({
      where: { name, domain },
    });
    if (existing) {
      throw new ForbiddenException(
        'Organization with this name and domain already exists',
      );
    }
    // Create organization and add owner as member
    return this.prisma.organization.create({
      data: {
        name,
        domain,
        members: {
          create: {
            userId: ownerId,
            role: 'owner',
          },
        },
      },
      include: { members: true },
    });
  }

  async updateOrganization(orgId: string, userId: string, name: string) {
    if (!name) throw new ForbiddenException('Organization name is required');
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
    });
    if (!org) throw new NotFoundException('Organization not found');
    // Only owner can update
    const membership = await this.prisma.organizationMembership.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId } },
    });
    if (!membership || membership.role !== 'owner')
      throw new ForbiddenException('Only owner can update');
    return this.prisma.organization.update({
      where: { id: orgId },
      data: { name },
    });
  }

  async inviteMember(orgId: string, ownerId: string, userId: string) {
    if (!userId) throw new ForbiddenException('User ID is required');
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
    });
    if (!org) throw new NotFoundException('Organization not found');
    // Only owner can invite
    const membership = await this.prisma.organizationMembership.findUnique({
      where: {
        organizationId_userId: { organizationId: orgId, userId: ownerId },
      },
    });
    if (!membership || membership.role !== 'owner')
      throw new ForbiddenException('Only owner can invite');
    // Check if already a member
    const existing = await this.prisma.organizationMembership.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId } },
    });
    if (existing) throw new ForbiddenException('User is already a member');
    // Check if already invited (pending only)
    const req = await this.prisma.membershipRequest.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId } },
    });
    if (req) {
      if (req.status === 'pending')
        throw new ForbiddenException('User already invited');
      if (req.status === 'rejected') {
        // Reinvite: set status to pending
        return this.prisma.membershipRequest.update({
          where: { organizationId_userId: { organizationId: orgId, userId } },
          data: { status: 'pending' },
        });
      }
      // If accepted, do not allow reinvite (already a member)
      throw new ForbiddenException('User already accepted invitation');
    }
    // Create membership request (only pending/rejected stored)
    return this.prisma.membershipRequest.create({
      data: {
        organizationId: orgId,
        userId,
        status: 'pending',
      },
    });
  }

  async respondToRequest(orgId: string, userId: string, accept: boolean) {
    const req = await this.prisma.membershipRequest.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId } },
    });
    if (!req) throw new NotFoundException('Request not found');
    if (req.status !== 'pending')
      throw new ForbiddenException('Request already handled');
    if (accept) {
      // Accept: add to membership, delete request row
      const existing = await this.prisma.organizationMembership.findUnique({
        where: { organizationId_userId: { organizationId: orgId, userId } },
      });
      if (existing) throw new ForbiddenException('Already a member');
      await this.prisma.organizationMembership.create({
        data: {
          organizationId: orgId,
          userId,
          role: 'member',
        },
      });
      await this.prisma.membershipRequest.delete({
        where: { organizationId_userId: { organizationId: orgId, userId } },
      });
    } else {
      // Reject: update status to rejected
      await this.prisma.membershipRequest.update({
        where: { organizationId_userId: { organizationId: orgId, userId } },
        data: { status: 'rejected' },
      });
    }
    return true;
  }

  async deleteOrganization(orgId: string, userId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
    });
    if (!org) throw new NotFoundException('Organization not found');
    // Only owner can delete
    const membership = await this.prisma.organizationMembership.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId } },
    });
    if (!membership || membership.role !== 'owner')
      throw new ForbiddenException('Only owner can delete');
    // Remove all related data: memberships, requests, etc.
    await this.prisma.organizationMembership.deleteMany({
      where: { organizationId: orgId },
    });
    await this.prisma.membershipRequest.deleteMany({
      where: { organizationId: orgId },
    });
    // Add other related deletes here if needed (pipelines, integrations, etc.)
    return this.prisma.organization.delete({ where: { id: orgId } });
  }

  async deleteMembershipRequest(orgId: string, userId: string) {
    // Only owner can delete membership requests
    const membership = await this.prisma.organizationMembership.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId } },
    });
    if (!membership || membership.role !== 'owner')
      throw new ForbiddenException('Only owner can delete requests');
    return this.prisma.membershipRequest.deleteMany({
      where: { organizationId: orgId, userId },
    });
  }

  async leaveOrganization(orgId: string, userId: string) {
    // Remove membership record
    const membership = await this.prisma.organizationMembership.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId } },
    });
    if (!membership) throw new NotFoundException('Membership not found');
    if (membership.role === 'owner') {
      throw new ForbiddenException(
        'Owner cannot leave. Delete the organization instead.',
      );
    }
    await this.prisma.organizationMembership.delete({
      where: { organizationId_userId: { organizationId: orgId, userId } },
    });
    return true;
  }
  // Get all members of an organization with their roles
  async getOrganizationMembers(orgId: string) {
    const members = await this.prisma.organizationMembership.findMany({
      where: { organizationId: orgId },
      include: { user: { select: { id: true, email: true, fullName: true } } },
    });
    return members.map((m) => ({
      userId: m.userId,
      email: m.user.email,
      fullName: m.user.fullName,
      role: m.role,
    }));
  }

  async searchUsersByDomain(
    domain: string,
    query: string,
    excludeUserIds: string[] = [],
    orgId?: string,
  ) {
    if (!domain || !query || query.length < 3) return [];
    // Exclude users who are already members or have a pending request for this org
    let excludeIds = [...excludeUserIds];
    if (orgId) {
      // Get all members (ensure only userId, not null)
      const members = await this.prisma.organizationMembership.findMany({
        where: { organizationId: orgId },
        select: { userId: true },
      });
      // Get all pending requests (ensure only userId, not null)
      const pendingRequests = await this.prisma.membershipRequest.findMany({
        where: { organizationId: orgId, status: 'pending' },
        select: { userId: true },
      });
      // Add all member and pending request userIds to excludeIds
      excludeIds = Array.from(
        new Set([
          ...excludeIds,
          ...members.map((m) => m.userId),
          ...pendingRequests.map((r) => r.userId),
        ]),
      );
    }
    return this.prisma.user.findMany({
      where: {
        AND: [
          { email: { contains: `@${domain}`, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { id: { notIn: excludeIds } },
        ],
      },
      select: { id: true, email: true, fullName: true },
      take: 10,
    });
  }

  // Requests sent by the user as owner (outgoing)
  async getSentMembershipRequests(userId: string) {
    // Find orgs where user is owner
    const ownerMemberships = await this.prisma.organizationMembership.findMany({
      where: { userId, role: 'owner' },
      select: { organizationId: true },
    });
    const orgIds = ownerMemberships.map((m) => m.organizationId);
    if (orgIds.length === 0) return [];
    // Find all pending/rejected requests for these orgs (do not include accepted)
    const requests = await this.prisma.membershipRequest.findMany({
      where: {
        organizationId: { in: orgIds },
        status: { in: ['pending', 'rejected'] },
      },
      include: {
        user: { select: { id: true, email: true, fullName: true } },
        organization: true,
      },
    });
    return requests.map((r) => ({
      id: r.id,
      organizationId: r.organizationId,
      organizationName: r.organization.name,
      userId: r.userId,
      userEmail: r.user.email,
      userFullName: r.user.fullName,
      status: r.status,
    }));
  }

  // Requests received by the user (incoming)
  async getIncomingMembershipRequests(userId: string) {
    // Only show pending/rejected requests for the user
    const requests = await this.prisma.membershipRequest.findMany({
      where: { userId, status: { in: ['pending', 'rejected'] } },
      include: { organization: true },
    });
    return requests.map((r) => ({
      id: r.id,
      organizationId: r.organizationId,
      organizationName: r.organization.name,
      status: r.status,
    }));
  }
}
