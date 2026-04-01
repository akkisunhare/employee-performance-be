import { Module } from '@nestjs/common';
import { EmailController } from './mail.controller';
import { EmailService } from './mail.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [EmailController],
  providers: [EmailService],
})
export class EmailModule {}