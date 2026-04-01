import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Req,
  Patch,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() createUserDto: CreateUserDto,
    @Req() req: any,
  ): Promise<User> {
    const organizationId = req.user.organizationId;
    createUserDto.organizationIds = [organizationId];
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Req() req: any): Promise<User[]> {
    const organizationId = req.user.organizationId;
    return this.usersService.findAll(organizationId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string): Promise<User> {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: CreateUserDto,
  ): Promise<User> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string): Promise<any> {
    return this.usersService.remove(id);
  }

  @Post('reset-password')
  @UseGuards(JwtAuthGuard)
  async resetPasswordWithOldPassword(@Body() resetDto: any, @Req() req: any): Promise<any> {
    const userId = req.user.sub;
    const oldPassword = resetDto.oldPassword;
    const newPassword = resetDto.newPassword;
    return this.usersService.resetPasswordWithOldPassword(userId, oldPassword, newPassword);
  }
  @Patch('reset-password-byAdmin')
  @UseGuards(JwtAuthGuard)
  async resetPasswordByAdmin(@Body() resetDto: any, @Req() req: any): Promise<any> {
    const userId = req.user.sub;
    const ResetPasswordId = resetDto.resetPasswordId;
    return this.usersService.resetPasswordByAdmin(userId, ResetPasswordId);
  }
  
  @Post('updateRole')
  @UsePipes(new ValidationPipe())
  async updateRole(@Body() updateRoleDto: UpdateRoleDto): Promise<User> {
    return this.usersService.updateRole(updateRoleDto);
  }
  // user.controller.ts
  @Patch('edit-toggle/:orgId')
  @UseGuards(JwtAuthGuard)
  async toggleIsUserEditForOrg(
    @Param('orgId') orgId: string,
    @Query('value') value: string
  ) {
    const isUserEdit = value === 'true'; // convert string to boolean
    return this.usersService.updateIsUserEditForOrg(orgId, isUserEdit);
  }

  @Post('all-user')
  @UseGuards(JwtAuthGuard)
  async findUserByRole( @Req() req: any, @Body() body: any ): Promise<any> {
    const userId = req.user.sub; 
    const orgId = req.user.organizationId;
    return this.usersService.findUserByRole( orgId, userId, body?.role);
  }
}
