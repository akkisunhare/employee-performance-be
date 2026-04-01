import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  Request
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
import { DashboardService } from './dashboard.service';
import { myDashboardDto, myDashboardTeamDto } from './dto/my-dashboard.dto';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @UseGuards(JwtAuthGuard)
  @Get('teamById:id')
  getDashbord(@Param('id') id: string) {
    return this.dashboardService.getDashbordTeam(id); 
  }

  @UseGuards(JwtAuthGuard)
  @Post('my-dashboard')
  getMyDashbordData(@Request() req, @Body() body: myDashboardDto) {
    return this.dashboardService.getMyDashbordData(req.user, body); 
  }

  @UseGuards(JwtAuthGuard)
  @Post('dashboard-team')
  getUserAssignInTeamData(@Request() req, @Body() body: myDashboardTeamDto) {
    return this.dashboardService.getDashboardTeamData(req.user, body);
  }
}
