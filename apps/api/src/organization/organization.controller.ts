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
import { cp } from 'fs';

@UseGuards(JwtAuthGuard)
@Controller('organizations')
export class OrganizationController {
  // Common endpoint to create a project and link repo data
  @Post('projects')
  async createProject(@Req() req, @Body() body) {
    // body should match CreateProjectDto
    const result = await this.orgService.createProjectWithRepo(
      req.user.id,
      body,
    );
    console.log(
      '[OrganizationController] ✓ Project created with repo:',
      result,
    );
    return result;
  }
  constructor(private readonly orgService: OrganizationService) {}

  @Get()
  async findAll(@Req() req) {
    // Return organizations the user is a member of, with role
    const result = await this.orgService.getOrganizationsForUser(req.user.id);
    console.log('[OrganizationController] ✓ Fetched organizations:', result);
    return result;
  }

  @Post()
  async create(@Req() req, @Body() body: CreateOrganizationDto) {
    const result = await this.orgService.createOrganization(req.user.id, body);
    console.log('[OrganizationController] ✓ Organization created:', result);
    return result;
  }

  @Patch(':id')
  async update(
    @Req() req,
    @Param('id') id: string,
    @Body() body: UpdateOrganizationDto,
  ) {
    const result = await this.orgService.updateOrganization(
      id,
      req.user.id,
      body.name,
    );
    console.log('[OrganizationController] ✓ Organization updated:', result);
    return result;
  }

  @Delete(':id')
  async delete(@Req() req, @Param('id') id: string) {
    const result = await this.orgService.deleteOrganization(id, req.user.id);
    console.log('[OrganizationController] ✓ Organization deleted:', result);
    return result;
  }

  @Post(':id/invite')
  async invite(
    @Req() req,
    @Param('id') id: string,
    @Body() body: InviteMemberDto,
  ) {
    const result = await this.orgService.inviteMember(
      id,
      req.user.id,
      body.userId,
    );
    console.log('[OrganizationController] ✓ Member invited:', result);
    return result;
  }

  @Post(':id/respond')
  async respond(
    @Req() req,
    @Param('id') id: string,
    @Body() body: RespondToRequestDto,
  ) {
    const result = await this.orgService.respondToRequest(
      id,
      req.user.id,
      body.accept,
    );
    console.log('[OrganizationController] ✓ Responded to request:', result);
    return result;
  }

  @Get('search-users')
  async searchUsers(
    @Req() req,
    @Query('domain') domain: string,
    @Query('q') q: string,
    @Query('orgId') orgId?: string,
  ) {
    // Optionally exclude the current user from results
    const result = await this.orgService.searchUsersByDomain(
      domain,
      q,
      [req.user.id],
      orgId,
    );
    console.log('[OrganizationController] ✓ Users searched:', result);
    return result;
  }

  // Get outgoing membership requests (sent by owner)
  @Get('sent-requests')
  async sentRequests(@Req() req) {
    const result = await this.orgService.getSentMembershipRequests(req.user.id);
    console.log(
      '[OrganizationController] ✓ Sent membership requests fetched:',
      result,
    );
    return result;
  }

  // Get incoming membership requests (for the user)
  @Get('incoming-requests')
  async incomingRequests(@Req() req) {
    const result = await this.orgService.getIncomingMembershipRequests(
      req.user.id,
    );
    console.log(
      '[OrganizationController] ✓ Incoming membership requests fetched:',
      result,
    );
    return result;
  }

  // Leave organization (member only)
  @Post(':id/leave')
  async leave(@Req() req, @Param('id') id: string) {
    const result = await this.orgService.leaveOrganization(id, req.user.id);
    console.log('[OrganizationController] ✓ Left organization:', result);
    return result;
  }

  // Get all members of an organization with their roles
  @Get(':id/members')
  async getMembers(@Req() req, @Param('id') id: string) {
    const result = await this.orgService.getOrganizationMembers(id);
    console.log(
      '[OrganizationController] ✓ Organization members fetched:',
      result,
    );
    return result;
  }

  // Get all projects under an organization, including repo details
  // This will automatically sync GitHub repositories before fetching projects
  @Get(':id/projects')
  async getProjects(@Req() req, @Param('id') id: string) {
    const userId = req.user?.id;
    const result = await this.orgService.getProjectsWithRepo(id, userId);
    console.log(
      '[OrganizationController] ✓ Organization projects fetched:',
      result,
    );
    return result;
  }
}
