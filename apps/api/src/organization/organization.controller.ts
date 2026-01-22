import {
  Controller,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  Query,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  InviteMemberDto,
  RespondToRequestDto,
} from './dto/organization.dto';

@UseGuards(JwtAuthGuard)
@Controller('organizations')
export class OrganizationController {
  // Common endpoint to create a project and link repo data
  @Post('projects')
  async createProject(@Req() req, @Body() body) {
    // body should match CreateProjectDto
    return this.orgService.createProjectWithRepo(req.user.id, body);
  }
  constructor(private readonly orgService: OrganizationService) {}

  @Get()
  async findAll(@Req() req) {
    // Return organizations the user is a member of, with role
    return this.orgService.getOrganizationsForUser(req.user.id);
  }

  @Post()
  async create(@Req() req, @Body() body: CreateOrganizationDto) {
    return this.orgService.createOrganization(
      req.user.id,
      body.name,
      body.domain,
    );
  }

  @Patch(':id')
  async update(
    @Req() req,
    @Param('id') id: string,
    @Body() body: UpdateOrganizationDto,
  ) {
    return this.orgService.updateOrganization(id, req.user.id, body.name);
  }

  @Delete(':id')
  async delete(@Req() req, @Param('id') id: string) {
    return this.orgService.deleteOrganization(id, req.user.id);
  }

  @Post(':id/invite')
  async invite(
    @Req() req,
    @Param('id') id: string,
    @Body() body: InviteMemberDto,
  ) {
    return this.orgService.inviteMember(id, req.user.id, body.userId);
  }

  @Post(':id/respond')
  async respond(
    @Req() req,
    @Param('id') id: string,
    @Body() body: RespondToRequestDto,
  ) {
    return this.orgService.respondToRequest(id, req.user.id, body.accept);
  }

  @Get('search-users')
  async searchUsers(
    @Req() req,
    @Query('domain') domain: string,
    @Query('q') q: string,
    @Query('orgId') orgId?: string,
  ) {
    // Optionally exclude the current user from results
    return this.orgService.searchUsersByDomain(domain, q, [req.user.id], orgId);
  }

  // Get outgoing membership requests (sent by owner)
  @Get('sent-requests')
  async sentRequests(@Req() req) {
    return this.orgService.getSentMembershipRequests(req.user.id);
  }

  // Get incoming membership requests (for the user)
  @Get('incoming-requests')
  async incomingRequests(@Req() req) {
    return this.orgService.getIncomingMembershipRequests(req.user.id);
  }

  // Leave organization (member only)
  @Post(':id/leave')
  async leave(@Req() req, @Param('id') id: string) {
    return this.orgService.leaveOrganization(id, req.user.id);
  }

  // Get all members of an organization with their roles
  @Get(':id/members')
  async getMembers(@Req() req, @Param('id') id: string) {
    return this.orgService.getOrganizationMembers(id);
  }

  // Get all projects under an organization, including repo details
  @Get(':id/projects')
  async getProjects(@Req() req, @Param('id') id: string) {
    return this.orgService.getProjectsWithRepo(id);
  }
}
