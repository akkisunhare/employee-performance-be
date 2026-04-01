

import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
import { TeamByIdService } from './teamById.service';

export class TeamMemberDto {
   teamId: string;
  memberId: string[]; // Array of member IDs
  organizationId?: string;
  userId?: string;
  userName?: string;
}

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class TeamByIdController {
  constructor(private readonly teamByIdService: TeamByIdService) {}

//   @Post('teamById')
//   getDashboard(@Body() dto: TeamMemberDto, @Req() req: any): Promise<any> {
//     const { organizationId, sub, name } = req.user;
//     dto.organizationId = organizationId;
//     dto.userId = sub;
//     dto.userName = name;
//     // memberId = dto.memberId;
//     // teamId = dto.memberId;

//     return this.teamByIdService.getDashbordTeam(dto);
//   }

  @Post('teamById')
  getDashboard(@Body() dto: TeamMemberDto) {
    return this.teamByIdService.getDashbordTeam(dto);
  }
}
