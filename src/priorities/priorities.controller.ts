import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { PrioritiesService } from './priorities.service';
import { CreatePriorityDto } from './dto/create-priority.dto';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import { UpdateWeekStatusDto } from './dto/update-week-status.dto';
import { PrioDto } from './dto/get-all-priorities.dto';

@Controller('priorities')
@UseGuards(JwtAuthGuard)
export class PrioritiesController {
  constructor(private readonly prioritiesService: PrioritiesService) {}

  @Post()
  create(@Request() req, @Body() createPriorityDto: CreatePriorityDto) {
    return this.prioritiesService.create(createPriorityDto, req.user);
  }

  @Get()
  findAll(@Request() req) {
    return this.prioritiesService.findAll(req.user);
  }

  @Get('type/:type')
  findByType(@Request() req, @Param('type') type: string) {
    return this.prioritiesService.findByType(type, req.user);
  }

  @Post('type')
  findByTypePost(@Request() req, @Body() body: PrioDto) {
    return this.prioritiesService.findByTypePost(body, req.user);
  }

  @Get(':id/history')
  findHistory(@Param('id') id: string) {
    return this.prioritiesService.findHistory(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.prioritiesService.findOne(id);
  }

  @Patch(':id')
  updatePriorityDetails(@Request() req, @Param('id') id: string, @Body() updatePriorityDto: CreatePriorityDto) {
    return this.prioritiesService.updatePriorityDetails(id, updatePriorityDto, req.user);
  }

   @Patch(':id/week-status')
  async updateWeekStatus(
    @Param('id') id: string,
    @Body() updateWeekStatusDto: UpdateWeekStatusDto,
    @Request() req
  ) {
    return this.prioritiesService.updateWeekStatus(id, updateWeekStatusDto, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.prioritiesService.remove(id);
  }
}