import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KpiModule } from './kpi/kpi.module';
import { UsersModule } from './users/users.module';
import { TeamsModule } from './teams/teams.module';
import { AuthModule } from './auth/auth.module';
import { OrganisationModule } from './organisation/organisation.module';
import { PrioritiesModule } from './priorities/priorities.module';
import { PermissionsModule } from './permissions/permissions.module';
import { QuartersModule } from './quarter/quarter.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DashboardModule } from './dashboard/dashboard.module';
import { EmailModule } from './mail-send/mail.module';
import { MigrationModule } from './migrations/migration.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    KpiModule,
    UsersModule,
    TeamsModule,
    AuthModule,
    OrganisationModule,
    PrioritiesModule,
    PermissionsModule,
    QuartersModule,
    DashboardModule,
    EmailModule,
    MigrationModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
