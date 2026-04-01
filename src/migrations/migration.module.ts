import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
// import { KpiController } from './kpi.controller';
// import { KpiService } from './kpi.service';
// import { KpiSchema, Kpi } from './entities/kpi.entity';
import { Team, TeamSchema } from 'src/teams/entities/team.entity';
import { PermissionsModule } from 'src/permissions/permissions.module';
import { QuartersModule } from 'src/quarter/quarter.module';
import { EmailService } from 'src/mail-send/mail.service';
import { MigrationService } from './migration.service';
import { MigrationController } from './migration.controller';
import { Kpi, KpiSchema } from 'src/kpi/entities/kpi.entity';
import { User, UserSchema } from 'src/users/entities/user.entity';
import { Priority, PrioritySchema } from 'src/priorities/entity/priority.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Kpi.name, schema: KpiSchema },
      { name: Team.name, schema: TeamSchema },
      { name: User.name, schema: UserSchema },
      { name: Priority.name, schema: PrioritySchema },
    ]),
    PermissionsModule,
    QuartersModule,
  ],
  controllers: [MigrationController],
  providers: [MigrationService, EmailService],
  exports: [MigrationService],
})
export class MigrationModule {}
