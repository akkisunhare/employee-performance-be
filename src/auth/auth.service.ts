import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { QuarterService } from 'src/quarter/quarter.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel('Organization') private organizationModel: Model<any>,
    private jwtService: JwtService,
    private quarterService:QuarterService
  ) {}

  async signup(name: string, email: string, password: string): Promise<any> {
    try {
      // Input validation
      if (!name || !email || !password) {
        throw new BadRequestException(
          'All fields (name, email, password) are required',
        );
      }

      // Check if user already exists
      const existingUser = await this.userModel.findOne({ email }).exec();
      if (existingUser) {
        throw new BadRequestException('Email already in use');
      }

      const hashedPassword = await bcrypt.hash(password, 10).catch((err) => {
        throw new InternalServerErrorException('Error hashing password');
      });

      const user = await this.userModel
        .create({
          name,
          email,
          password: hashedPassword,
          role: 'organization_owner',
          createdAt: new Date(),
        })
        .catch((err) => {
          throw new InternalServerErrorException('Error creating user');
        });

      const payload = { sub: user._id, email: user.email, role: user.role,name:user.name };
      const token = this.jwtService.sign(payload);

      return { token, user };
    } catch (error) {
      // Re-throw known exceptions, wrap unknown ones
      if (
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An unexpected error occurred during signup',
      );
    }
  }

  async login(email: string, password: string): Promise<any> {
    try {
      if (!email || !password) {
        throw new BadRequestException('Email and password are required');
      }

      const user = await this.userModel.findOne({ email }).exec();
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const isPasswordValid = await bcrypt
        .compare(password, user.password)
        .catch((err) => {
          throw new InternalServerErrorException('Error verifying password');
        });

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      let organizations = [];
      if (user.organizationIds?.length > 0) {
        organizations = await Promise.all(
          user.organizationIds.map(async (id) => {
            try {
              const org = await this.organizationModel.findById(id).exec();
              // Add a flag to indicate if user is the creator
              if (org) {
                const isCreator = org.creatorId && 
                  org.creatorId.toString() === user._id.toString();
                return {
                  ...org.toObject(),
                  isCreator
                };
              }
              return null;
            } catch (err) {
              throw new InternalServerErrorException(
                `Error fetching organization ${id}`,
              );
            }
          }),
        )
        .then(orgs => orgs.filter(Boolean)) // Filter out any nulls
        .catch((err) => {
          throw new InternalServerErrorException(
            'Error fetching organizations',
          );
        });
      }

      // Determine default organization and role
      const defaultOrg = organizations.length > 0 ? organizations[0] : null;
      const defaultOrgId = defaultOrg?._id?.toString();
      
      if (defaultOrgId) {
        await this.quarterService.checkAndCreateQuartersOnLogin(user._id.toString(), defaultOrgId); // Create quarters if not exist
      }
      // Find user's role for the default organization
      let userRole = user.role || 'user'; // Default to global role
      
      if (defaultOrgId && user.organizationRoles) {
        const orgRole = user.organizationRoles.find(
          r => r.organizationId.toString() === defaultOrgId
        );
        
        if (orgRole) {
          userRole = orgRole.role;
        }
      }

      // Create JWT payload with organization info
      const payload = { 
        sub: user._id, 
        email: user.email, 
        role: userRole,
        organizationId: defaultOrgId || undefined,
        name:user.name
      };
      
      const token = this.jwtService.sign(payload);

      const { password: _, ...userWithoutPassword } = user.toObject();
      return { token, user: userWithoutPassword, organizations };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An unexpected error occurred during login',
      );
    }
  }

  async getProfile(userId: string): Promise<any> {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      const user = await this.userModel.findById(userId).exec();
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      let organizations = [];
      if (user.organizationIds?.length > 0) {
        organizations = await Promise.all(
          user.organizationIds.map(async (id) => {
            try {
              const org = await this.organizationModel.findById(id).exec();
              // Add a flag to indicate if user is the creator
              if (org) {
                const isCreator = org.creatorId && 
                  org.creatorId.toString() === user._id.toString();
                return {
                  ...org.toObject(),
                  isCreator
                };
              }
              return null;
            } catch (err) {
              throw new InternalServerErrorException(
                `Error fetching organization ${id}`,
              );
            }
          }),
        )
        .then(orgs => orgs.filter(Boolean)) // Filter out any nulls
        .catch((err) => {
          throw new InternalServerErrorException(
            'Error fetching organizations',
          );
        });
      }

      const { password: _, ...userWithoutPassword } = user.toObject();
      return { ...userWithoutPassword, organizations };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An unexpected error occurred while fetching profile',
      );
    }
  }

  async updateTokenWithOrganization(userId: string, organizationId: string) {
    try {
      if (!userId || !organizationId) {
        throw new BadRequestException(
          'User ID and Organization ID are required',
        );
      }

      const user = await this.userModel.findById(userId).exec();
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      if (
        !user.organizationIds?.some((id) => id.toString() === organizationId)
      ) {
        throw new UnauthorizedException(
          'User does not belong to this organization',
        );
      }
      
      // Find the user's role for this organization
      let orgSpecificRole = 'user'; // Default role
      
      // Check if user has an organization-specific role
      const orgRole = user.organizationRoles?.find(
        r => r.organizationId.toString() === organizationId
      );
      
      if (orgRole) {
        orgSpecificRole = orgRole.role;
        // console.log(`Found organization-specific role: ${orgSpecificRole} for org ${organizationId}`);
      } else {
        // console.log(`No organization-specific role found for org ${organizationId}, using default: ${user.role}`);
        // If no org-specific role found, use the user's global role
        orgSpecificRole = user.role || 'user';
      }

      // Include organization-specific role in the JWT token
      const payload = {
        sub: user._id,
        email: user.email,
        role: orgSpecificRole,  // Use the organization-specific role
        organizationId: organizationId,
        name:user.name
      };

      const token = this.jwtService.sign(payload);
      return { token };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An unexpected error occurred while updating token',
      );
    }
  }
}
