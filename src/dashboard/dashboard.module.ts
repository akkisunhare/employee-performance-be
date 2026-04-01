import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Organization, OrganizationSchema } from './entities/organisation.entity';
import { User, UserSchema } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { QuartersModule } from 'src/quarter/quarter.module';
import { Quarter, QuarterSchema } from 'src/quarter/entities/quarter.schema';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Team, TeamSchema } from 'src/teams/entities/team.entity';
import { Kpi, KpiSchema } from 'src/kpi/entities/kpi.entity';
import { TeamByIdController } from './teamById/teamById.controller';
import { TeamByIdService } from './teamById/teamById.service';
import { Priority, PrioritySchema } from 'src/priorities/entity/priority.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Organization.name, schema: OrganizationSchema },
      { name: User.name, schema: UserSchema },
      { name: Team.name, schema: TeamSchema },
      { name: Kpi.name, schema: KpiSchema },
      { name: Quarter.name, schema : QuarterSchema },
      { name: Priority.name, schema : PrioritySchema },
    ]),
    forwardRef(() => UsersModule),
    QuartersModule
  ],
  controllers: [DashboardController, TeamByIdController],
  providers: [DashboardService, TeamByIdService],
  exports: [DashboardService, TeamByIdService],
})
export class DashboardModule {}
