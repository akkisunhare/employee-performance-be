import { Body, Controller, Post } from '@nestjs/common';
import { sendEmailDto } from './dto/mail.dto';
import { EmailService } from './mail.service';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send')
  async sendMail(@Body() dto: sendEmailDto) {
    return await this.emailService.updatePrioritiesEmail(dto);
  }
}