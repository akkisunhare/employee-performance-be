import {
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Team } from './entities/team.entity';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { ApiResponse } from '../types/api-response.interface';

interface getAllTeamApiRes<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
  };
}
@Injectable()
export class TeamsService {
  constructor(@InjectModel(Team.name) private teamModel: Model<Team>) {}

  async create(createTeamDto: CreateTeamDto): Promise<ApiResponse<Team>> {
    try {
      const createdTeam = new this.teamModel(createTeamDto);
      await createdTeam.save();

      const team = await this.teamModel
        .findById(createdTeam._id)
        .populate('memberIds', 'name')
        .populate('createdBy', 'name')
        .populate('lastUpdatedBy', 'name')
        .exec();

      return {
        success: true,
        message: `${team.name} has been created successfully`,
        data: team,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Error creating team',
          data: null,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(orgId: string): Promise<ApiResponse<Team[]>> {
    try {
      const teams = await this.teamModel
        .find({
          organizationId: orgId,
        })
        .populate('memberIds', 'name')
        .populate('createdBy', 'name')
        .populate('lastUpdatedBy', 'name')
        .exec();

      return {
        success: true,
        message: 'Teams retrieved successfully',
        data: teams,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Error retrieving teams',
          data: null,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // async findAll(
  //   orgId: string,
  //   page = 1,
  //   limit = 10,
  // ): Promise<getAllTeamApiRes<Team[]>> {
  //   try {
  //     const skip = (page - 1) * limit;

  //     const [teams, total] = await Promise.all([
  //       this.teamModel
  //         .find({ organizationId: orgId })
  //         .skip(skip)
  //         .limit(limit)
  //         .populate('memberIds', 'name')
  //         .populate('createdBy', 'name')
  //         .populate('lastUpdatedBy', 'name')
  //         .exec(),

  //       this.teamModel.countDocuments({ organizationId: orgId }),
  //     ]);      

  //     return {
  //       success: true,
  //       message: 'Teams retrieved successfully',
  //       data: teams,
  //       meta: {
  //         page,
  //         limit,
  //         totalPages: Math.ceil(total / limit),
  //         totalItems: total,
  //       },
  //     };
  //   } catch (error) {
  //     throw new HttpException(
  //       {
  //         success: false,
  //         message: 'Error retrieving teams',
  //         data: null,
  //       },
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }

  async findOne(id: string): Promise<ApiResponse<Team>> {
    try {
      const team = await this.teamModel
        .findById(id)
        .populate('memberIds', 'name')
        .populate('createdBy', 'name')
        .populate('lastUpdatedBy', 'name')
        .exec();

      if (!team) {
        throw new NotFoundException('Team not found');
      }

      return {
        success: true,
        message: 'Team retrieved successfully',
        data: team,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Error retrieving team',
          data: null,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(
    id: string,
    updateTeamDto: UpdateTeamDto,
  ): Promise<ApiResponse<Team>> {
    try {
      const existingTeam = await this.teamModel.findById(id);

      if (!existingTeam) {
        throw new NotFoundException('Team not found');
      }

      // Only update the fields that are provided in updateTeamDto
      const updateData: any = {};
      if (updateTeamDto.name) updateData.name = updateTeamDto.name;
      if (updateTeamDto.owner) updateData.owner = updateTeamDto.owner;
      if (updateTeamDto.memberIds)
        updateData.memberIds = updateTeamDto.memberIds;
      if (updateTeamDto.lastUpdatedBy) {
        updateData.lastUpdatedBy = new Types.ObjectId(
          updateTeamDto.lastUpdatedBy,
        );
      }

      const updatedTeam = await this.teamModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .populate('memberIds', 'name')
        .populate('createdBy', 'name')
        .populate('lastUpdatedBy', 'name')
        .exec();

      return {
        success: true,
        message: `${updatedTeam.name} has been updated successfully`,
        data: updatedTeam,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Error updating team',
          data: null,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: string): Promise<ApiResponse<null>> {
    try {
      const team = await this.teamModel.findById(id);

      if (!team) {
        throw new NotFoundException('Team not found');
      }

      await this.teamModel.findByIdAndDelete(id).exec();

      return {
        success: true,
        message: 'Team deleted successfully',
        data: null,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Error deleting team',
          data: null,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
