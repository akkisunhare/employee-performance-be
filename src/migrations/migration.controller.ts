import { Controller, Post, Body, UseGuards, Req, Query } from '@nestjs/common';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
import { MigrationService } from './migration.service';
import { UserDataDto } from './dto/userData.dto';

@UseGuards(JwtAuthGuard)
@Controller('migration')
export class MigrationController {
  constructor(private readonly service: MigrationService) {}

  // @Post('kpi-migration')
  // async run(@Query('orgId') orgId: string, @Query('moduleName') module: string) {
  //   // return this.service.runMigration(orgId, module);
  //   return this.service.updateKpiAndPriority(orgId, module);
  // }

  @Post('kpi-migration')
  async runMigration(@Req() req: any,@Body() userDataDto: UserDataDto,) {
    const orgId = req.user.organizationId;
    return this.service.updateKpiAndPriority(orgId, userDataDto);
  }
}
