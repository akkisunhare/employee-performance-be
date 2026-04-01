import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/users/entities/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from 'src/strategy/jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OrganizationSchema } from 'src/organisation/entities/organisation.entity';
import { QuarterService } from 'src/quarter/quarter.service';
import { QuartersModule } from 'src/quarter/quarter.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: 'Organization', schema: OrganizationSchema },
    ]),
    QuartersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>(
          'JWT_SECRET',
          'your-secure-secret-key',
        ),
        signOptions: {},
      }),
      inject: [ConfigService],
 
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy,QuarterService],
})
export class AuthModule {}
