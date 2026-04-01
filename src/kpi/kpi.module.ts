import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KpiController } from './kpi.controller';
import { KpiService } from './kpi.service';
import { KpiSchema, Kpi } from './entities/kpi.entity';
import { Team, TeamSchema } from 'src/teams/entities/team.entity';
import { PermissionsModule } from 'src/permissions/permissions.module';
import { QuartersModule } from 'src/quarter/quarter.module';
import { EmailService } from 'src/mail-send/mail.service';
import { User, UserSchema } from 'src/users/entities/user.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Kpi.name, schema: KpiSchema },
      { name: Team.name, schema: TeamSchema },
      { name: User.name, schema: UserSchema }
    ]),
    PermissionsModule,
    QuartersModule
  ],
  controllers: [KpiController],
  providers: [KpiService, EmailService],
  exports: [KpiService],
})
export class KpiModule {}
