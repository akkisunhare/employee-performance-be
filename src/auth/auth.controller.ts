import {
  Controller,
  Post,
  Body,
  Get,
  Request,
  UseGuards,
  Logger,
  Headers,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  @Post('signup')
  async signup(
    @Body('name') name: string,
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    return this.authService.signup(name, email, password);
  }

  @Post('login')
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    const result = await this.authService.login(email, password);
    this.logger.log(`User logged in: ${email}`);
    this.logger.log(`Token generated: ${result.access_token ? 'Yes' : 'No'}`);
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req, @Headers() headers) {
    // this.logger.log(
    //   `Authorization header: ${headers.authorization || 'Not present'}`,
    // );
    // this.logger.log(`User data in request: ${JSON.stringify(req.user)}`);
    return this.authService.getProfile(req.user?.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('update-token')
  async updateToken(
    @Body('organizationId') organizationId: string,
    @Req() req: any,
  ) {
    const userId = req.user.sub;
    return this.authService.updateTokenWithOrganization(userId, organizationId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('role')
  async getCurrentRole(@Req() req: any): Promise<any> {
    // Return the user's current role and organization from the token
    return { 
      role: req.user.role, 
      organizationId: req.user.organizationId,
      userId: req.user.sub
    };
  }
}
