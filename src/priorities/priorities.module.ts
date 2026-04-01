import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PrioritiesController } from './priorities.controller';
import { PrioritiesService } from './priorities.service';
import { PriorityHistory, PriorityHistorySchema } from './priority-history.schema';
import { Team, TeamSchema } from '../teams/entities/team.entity';
import { User, UserSchema } from '../users/entities/user.entity';
import { Priority, PrioritySchema } from './entity/priority.schema';
import { PermissionsModule } from 'src/permissions/permissions.module';
import { EmailService } from 'src/mail-send/mail.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Priority.name, schema: PrioritySchema },
      { name: PriorityHistory.name, schema: PriorityHistorySchema },
      { name: Team.name, schema: TeamSchema },
      { name: User.name, schema: UserSchema }
    ]),
     PermissionsModule,
  ],
  controllers: [PrioritiesController],
  providers: [PrioritiesService, EmailService],
})
export class PrioritiesModule {}