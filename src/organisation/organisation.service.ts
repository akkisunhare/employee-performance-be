import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Organization } from './entities/organisation.entity';
import { CreateOrganisationDto } from './dto/create-organisation.dto';
import { UpdateOrganisationDto } from './dto/update-organisation.dto';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { generate91DayQuarters } from 'src/quarter/quarter.utils';
import { Quarter } from 'src/quarter/entities/quarter.schema';
import { UserRole } from 'src/users/dto/create-user.dto';

@Injectable()
export class OrganisationService {
  constructor(
    @InjectModel(Organization.name)
    private organizationModel: Model<Organization>,
    @InjectModel(Quarter.name)
    private  quarterModel: Model<Quarter>, 
    @InjectModel(User.name)
    @Inject(forwardRef(() => UsersService))
    private  userModel: Model<User>,
   
    private readonly usersService: UsersService,
  ) {}

  async create(createOrganisationDto: CreateOrganisationDto, userId: string) {
    // Create the organization
    const organization = new this.organizationModel({
      ...createOrganisationDto,
      createdBy: new Types.ObjectId(userId),
    });
    const savedOrg = await organization.save();

    // Update user's organizationIds
    const res = await this.userModel.findByIdAndUpdate(
      userId,
      { $addToSet: { organizationIds: savedOrg._id.toString() } },
      { new: true },
    );

    // Set the user as organization owner
    try {
      await this.usersService.updateRole({
        userId,
        organizationId: savedOrg._id.toString(),
        role: UserRole.ORGANIZATION_OWNER,
      });
    } catch (error) {
      console.error('Failed to set user as organization owner:', error);
      // Continue with organization creation even if role update fails
    }
    const currentYear = new Date().getFullYear();
    const quarters = generate91DayQuarters(currentYear);

try {
  for (const q of quarters) {
    const exists = await this.quarterModel.findOne({
      quarter: q.quarter,
      year: q.year,
      organizationId: savedOrg._id,
    });

    if (!exists) {
      await new this.quarterModel({
        quarter: q.quarter,
        year: q.year,
        start_date: q.start_date,  // explicitly set
        end_date: q.end_date,      // explicitly set
        organizationId: savedOrg._id.toString(),
      }).save();
    }
  }
} catch (error) {
  console.error(`Failed to create default quarters for organization ${savedOrg._id}:`, error);
}
    return savedOrg;
  }

  async findAll() {
    return this.organizationModel.find().exec();
  }

  async findOne(id: string) {
    return this.organizationModel.findById(id).exec();
  }

  async update(id: string, updateOrganisationDto: UpdateOrganisationDto) {
    return this.organizationModel
      .findByIdAndUpdate(id, updateOrganisationDto, { new: true })
      .exec();
  }

  async remove(id: string) {
    return this.organizationModel.findByIdAndDelete(id).exec();
  }
}
