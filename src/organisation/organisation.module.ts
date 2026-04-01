import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrganisationController } from './organisation.controller';
import { OrganisationService } from './organisation.service';
import { Organization, OrganizationSchema } from './entities/organisation.entity';
import { User, UserSchema } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { QuartersModule } from 'src/quarter/quarter.module';
import { Quarter } from 'src/quarter/entities/quarter.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Organization.name, schema: OrganizationSchema },
      { name: User.name, schema: UserSchema },
     
    ]),
    forwardRef(() => UsersModule),
    QuartersModule
  ],
  controllers: [OrganisationController],
  providers: [OrganisationService],
  exports: [OrganisationService],
})
export class OrganisationModule {}
