import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { sendEmailDto } from './dto/mail.dto';

@Injectable()
export class EmailService {
  constructor(private readonly configService: ConfigService) {}

  emailTransport() {
    const transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_FROM'),
      port: this.configService.get<number>('MAIL_PORT'),
      secure: false,
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASSWORD'),
      },
    });
    return transporter;
  }

  async updatePrioritiesEmail(dto: sendEmailDto) {
    const { recipients, subject, data } = dto;
    const transport = this.emailTransport();
    const options: nodemailer.SendMailOptions = {
      from: this.configService.get<string>('EMAIL_USER'),
      to: recipients,
      subject: subject,
      html: `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Priority Updated</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f8f9fa;
              padding: 20px;
              color: #333;
            }
            .email-container {
              background-color: lightblue;
              padding: 30px;
              border-radius: 8px;
              max-width: 600px;
              margin: auto;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            }
            .greeting {
              font-size: 18px;
              margin-bottom: 20px;
            }
            .message {
              font-size: 16px;
              line-height: 1.6;
            }
            .footer {
              margin-top: 30px;
              font-size: 14px;
              color: #777;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="greeting">Hey ${data || 'User'},</div>
            <div class="message">
              Your priority has been updated by a team member.<br />
              Please check your dashboard for the latest changes.
            </div>
            <div class="footer">
              Thank you,<br />
              The Team
            </div>
          </div>
        </body>
      </html>`
    };
    try {
      await transport.sendMail(options);
      console.log('Email sent successfully');
    } catch (error) {
      console.log('Error sending mail: ', error);
    }
  }
  async updateKpiEmail(dto: sendEmailDto) {
    const { recipients, subject, data } = dto;
    const transport = this.emailTransport();
    const options: nodemailer.SendMailOptions = {
      from: this.configService.get<string>('EMAIL_USER'),
      to: recipients,
      subject: subject,
      html: `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Priority Updated</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f8f9fa;
              padding: 20px;
              color: #333;
            }
            .email-container {
              background-color: lightblue;
              padding: 30px;
              border-radius: 8px;
              max-width: 600px;
              margin: auto;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            }
            .greeting {
              font-size: 18px;
              margin-bottom: 20px;
            }
            .message {
              font-size: 16px;
              line-height: 1.6;
            }
            .footer {
              margin-top: 30px;
              font-size: 14px;
              color: #777;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="greeting">Hey ${data || 'User'},</div>
            <div class="message">
              Your kapi has been updated by a team member.<br />
              Please check your dashboard for the latest changes.
            </div>
            <div class="footer">
              Thank you,<br />
              The Team
            </div>
          </div>
        </body>
      </html>`
    };
    try {
      await transport.sendMail(options);
      console.log('Email sent successfully');
    } catch (error) {
      console.log('Error sending mail: ', error);
    }
  }
}
