import { forwardRef, Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { KpiModule } from 'src/kpi/kpi.module';
import { UsersModule } from 'src/users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/users/entities/user.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    forwardRef(() => KpiModule),
    UsersModule
  ],
  providers: [PermissionsService],
  exports: [PermissionsService],
})
export class PermissionsModule {} // ✅ This line is CRITICAL
