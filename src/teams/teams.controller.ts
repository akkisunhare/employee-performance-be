// src/teams/teams.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { Team } from './entities/team.entity';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
import { ApiResponse } from '../types/api-response.interface';
import { Types } from 'mongoose';

@UseGuards(JwtAuthGuard)
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @UsePipes(new ValidationPipe())
  async create(
    @Body() createTeamDto: CreateTeamDto,
    @Req() req: any,
  ): Promise<ApiResponse<Team>> {
    const organizationId = req.user.organizationId;
    createTeamDto.organizationId = organizationId;
    createTeamDto.createdBy = new Types.ObjectId(req.user.sub);
    return this.teamsService.create(createTeamDto);
  }

  @Get()
  async findAll(@Req() req: any): Promise<ApiResponse<Team[]>> {
    const organizationId = req.user.organizationId;
    return this.teamsService.findAll(organizationId);
  }
  // @Post('all-teams')
  // async findAll(
  //   @Req() req: any,
  //   @Body() body: { page?: number; limit?: number }
  // ): Promise<ApiResponse<Team[]>> {
  //   const organizationId = req.user.organizationId;
  //   const page = body.page ?? 1;
  //   const limit = body.limit ?? 10;

  //   return this.teamsService.findAll(organizationId, page, limit);
  // }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiResponse<Team>> {
    return this.teamsService.findOne(id);
  }

  @Put(':id')
  @UsePipes(new ValidationPipe())
  async update(
    @Param('id') id: string,
    @Body() updateTeamDto: UpdateTeamDto,
    @Req() req: any,
  ): Promise<ApiResponse<Team>> {
    updateTeamDto.lastUpdatedBy = new Types.ObjectId(req.user.sub);
    return this.teamsService.update(id, updateTeamDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<ApiResponse<null>> {
    return this.teamsService.remove(id);
  }
}
