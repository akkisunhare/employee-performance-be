import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import * as nodemailer from 'nodemailer';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Team } from 'src/teams/entities/team.entity';

@Injectable()
export class UsersService {
  private transporter;
  private jwtService: JwtService;

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Team.name) private teamModel: Model<Team>
  ) {
    this.transporter = nodemailer.createTransport({
      host: "smtp.office365.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
       tls: {
                ciphers: 'SSLv3',
            },
    });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const testPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(testPassword, 10);

      const existingUser = await this.userModel
        .findOne({
          email: createUserDto.email.toLowerCase(),
        })
        .exec();
      if (existingUser) {
        throw new BadRequestException('User already exists');
      }

      const userData = {
        ...createUserDto,
        password: hashedPassword,
      };

      const createdUser = new this.userModel(userData);
      const savedUser = await createdUser.save();

      // Send email asynchronously without blocking
      this.sendWelcomeEmail(savedUser, testPassword).catch((error) => {
        console.error('Error sending welcome email:', error);
      });

      return savedUser;
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  private async sendWelcomeEmail(user: User, password: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"Goals Module" ${process.env.EMAIL_USER}`,
        to: user.email,
        subject: 'Welcome to Goals! Your Account Details',
        text: `Hello ${user.name || 'User'},

Your account has been created successfully!
Email: ${user.email}
Temporary Password: ${password}

Please log in and change your password as soon as possible.
Login URL:${process.env.VITE_FRONTEND_URL || 'https://tools.quikit.ai/'}



Best regards,
Your App Team`,
        html: `<p>Hello ${user.name || 'User'},</p>
<p>Your account has been created successfully!</p>
<p>Email: ${user.email}</p>
<p>Temporary Password: <strong>${password}</strong></p>
<p>Please <a href=${process.env.VITE_FRONTEND_URL || 'https://tools.quikit.ai/'} target="_blank">Click Here</a> to login and change your password as soon as possible.</p>
`,
      });
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw error;
    }
  }

  async findAll(orgId: string): Promise<User[]> {
    try {
      return await this.userModel
        .find({
          organizationIds: {
            $elemMatch: { $eq: orgId },
          },
        })
        .exec();
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch users');
    }
  }

  async findOne(id: string): Promise<User> {
    try {
      const user = await this.userModel.findOne({ id }).exec();
      if (!user) {
        throw new BadRequestException('User not found');
      }
      return user;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch user');
    }
  }

  async update(id: string, updateUserDto: CreateUserDto): Promise<User> {
    try {
      const objectId = new Types.ObjectId(id);
      const updatedUser = await this.userModel
        .findOneAndUpdate({ _id: objectId }, updateUserDto, {
          new: true,
        })
        .exec();

      if (!updatedUser) {
        throw new BadRequestException('User not found');
      }
      return updatedUser;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update user');
    }
  }

  async remove(id: string): Promise<any> {
    try {
      const result = await this.userModel.deleteOne({ id }).exec();
      if (result.deletedCount === 0) {
        throw new BadRequestException('User not found');
      }
      return { message: 'User successfully deleted' };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete user');
    }
  }

  async resetPasswordWithOldPassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<any> {
    try {
      const user = await this.userModel.findById(userId).exec();
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Verify old password
      const isOldPasswordValid = await bcrypt.compare(
        oldPassword,
        user.password,
      );
      if (!isOldPasswordValid) {
        throw new UnauthorizedException('Invalid old password');
      }

      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        throw new BadRequestException(
          'New password must be different from old password',
        );
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      await this.userModel.updateOne(
        { _id: userId },
        {
          password: hashedNewPassword,
          updatedAt: new Date(),
        },
      );

      const payload = {
        sub: user._id,
        email: user.email,
        role: user.role,
      };
      // const token = this.jwtService.sign(payload);

      const updatedUser = await this.userModel.findById(userId).exec();
      const { password: _, ...userWithoutPassword } = updatedUser.toObject();

      return {
        // token,
        user: userWithoutPassword,
        message: 'Password successfully updated',
      };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
  async resetPasswordByAdmin(
    userId: string,
    resetPasswordId: string,
  ): Promise<any> {
    try {
      const user = await this.userModel.findById(resetPasswordId).exec();
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
       const testPassword = Math.random().toString(36).slice(-8);
      const hashedNewPassword = await bcrypt.hash(testPassword, 10);

      await this.userModel.updateOne(
        { _id: resetPasswordId },
        {
          password: hashedNewPassword,
          updatedAt: new Date(),
        },
      );

      const updatedUser = await this.userModel.findById(resetPasswordId).exec();
        // Send email asynchronously without blocking
       this.sendResetPasswordEmail(updatedUser, testPassword).catch((error) => {
        console.error('Error sending welcome email:', error);
      });
      
      const { password: _, ...userWithoutPassword } = updatedUser.toObject();

      return {
        // token,
        user: userWithoutPassword,
        message: 'Password successfully updated',
      };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  private async sendResetPasswordEmail(user: User, password: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"Goals Module" ${process.env.EMAIL_USER}`,
        to: user.email,
        subject: 'Welcome to Goals! Your Account Details',
        text: `Hello ${user.name || 'User'},
        This is a confirmation that your password has been successfully reset.!
        Email: ${user.email}
        Temporary Password: ${password}
        Please log in and change your password as soon as possible.
        Login URL:${process.env.VITE_FRONTEND_URL || 'https://tools.quikit.ai/'}
        Best regards,
        Your App Team`,
          html: `<p>Hello ${user.name || 'User'},</p>
        <p>This is a confirmation that your password has been successfully reset.!</p>
        <p>Email: ${user.email}</p>
        <p>Temporary Password: <strong>${password}</strong></p>
        <p>Please <a href=${process.env.VITE_FRONTEND_URL || 'https://tools.quikit.ai/'} target="_blank">Click Here</a> to login and change your password as soon as possible.</p>
        `,
      });
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw error;
    }
  }
  
  async updateRole(updateRoleDto: UpdateRoleDto): Promise<User> {
    try {
      const { userId, organizationId, role } = updateRoleDto;
      
      // Validate user and organization IDs
      if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(organizationId)) {
        throw new BadRequestException('Invalid user ID or organization ID');
      }
      
      // Convert string IDs to ObjectIDs
      const userObjectId = new Types.ObjectId(userId);
      const orgObjectId = new Types.ObjectId(organizationId);
      
      // Find the user
      const user = await this.userModel.findById(userObjectId).exec();
      if (!user) {
        throw new BadRequestException('User not found');
      }
      
      // Ensure user is associated with this organization
      const isUserInOrg = user.organizationIds.some(id => 
        id.toString() === organizationId
      );
      
      if (!isUserInOrg) {
        // Add organization to user's organizationIds if not already there
        user.organizationIds.push(orgObjectId);
      }
            
      // Initialize organizationRoles array if it doesn't exist
      if (!user.organizationRoles) {
        user.organizationRoles = [];
      }
      
      // Update or add organization role
      const existingRoleIndex = user.organizationRoles.findIndex(
        r => r.organizationId.toString() === organizationId
      );
      
      // if (existingRoleIndex !== -1) {
      //   // Update existing role
      //   user.organizationRoles[existingRoleIndex].role = role;
      // } else {
      //   // Add new role
      //   user.organizationRoles.push({
      //     organizationId: orgObjectId,
      //     role,
      //   });
      // }
            
      // Directly update the user document using updateOne to ensure all fields are saved
      await this.userModel.updateOne(
        { _id: userObjectId },
        { 
          $set: { 
            organizationRoles: user.organizationRoles,
            organizationIds: user.organizationIds
          }
        }
      );
      
      // Fetch and return the updated user
      const updatedUser = await this.userModel.findById(userObjectId).exec();
      return updatedUser;
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to update user role: ${error.message}`);
    }
  }

  // async updateIsUserEdit(userId: string, isUserEdit: boolean): Promise<User> {
  //   console.log(userId, isUserEdit);
    
  //   return this.userModel.findByIdAndUpdate(
  //     userId,
  //     { isUserEdit },
  //     { new: true }
  //   ).exec();
  // }
  // user.service.ts
  async updateIsUserEditForOrg(orgId: string, isUserEdit: boolean) {
    return this.userModel.updateMany(
      { organizationIds: orgId },
      { $set: { isUserEdit: isUserEdit } }
    );
  }

  async findUserByRole(orgId: any, userId: any, role: string) {
    try {
      let users = [];

      if (role === "organization_owner" || role === "admin") {
        // Get all users under the organization
        users = await this.userModel
          .find({
            organizationIds: { $elemMatch: { $eq: orgId } },
          })
          .select("_id name role")
          .exec();
      } else {
        // Get teams where the current user is the owner
        const teams = await this.teamModel
          .find({
            "owner.id": userId,
          })
          .select("memberIds")
          .exec();

        // Extract memberIds from all matching teams
        const memberIds = teams.flatMap((team) => team.memberIds);

        if (memberIds?.length > 0) {
          // Get user info for the memberIds
          users = await this.userModel
            .find({ _id: { $in: memberIds } })
            .select("_id name role")
            .exec();
        }
      }
      return {
        status: "success",
        message: "Users fetched successfully.",
        data: users,
      };
    } catch (error) {
      console.error("Error in findUserByRole:", error);
      throw new InternalServerErrorException("Failed to fetch users");
    }
  }

}
