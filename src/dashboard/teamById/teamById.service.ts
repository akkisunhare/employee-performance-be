import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Kpi } from 'src/kpi/entities/kpi.entity';

// DTO
export class TeamMemberDto {
  teamId: string;
  memberId: string[];
  organizationId?: string;
  userId?: string;
  userName?: string;
}

// export class TeamByIdService {
//   constructor(@InjectModel(Kpi.name) private kpiModel: Model<Kpi>) {}

//   async getDashbordTeam(dto: TeamMemberDto): Promise<any> {
//     const { memberId } = dto;
//     if (!Types.ObjectId.isValid(memberId)) {
//       return {
//         success: false,
//         message: 'Invalid memberId format. Must be a 24-character ObjectId string.',
//       };
//     }

//     try {
//       const objectId = new Types.ObjectId(memberId);

//       const kpis = await this.kpiModel.find({ 'ownerId.id': objectId }).exec();

//       return {
//         success: true,
//         count: kpis.length,
//         data: kpis,
//       };
//     } catch (error) {
//       return {
//         success: false,
//         message: 'Failed to fetch KPIs for member',
//         error: error.message,
//       };
//     }
//   }
// }

// @Injectable()
// export class TeamByIdService {
//   constructor(@InjectModel(Kpi.name) private kpiModel: Model<Kpi>) {}

//   async getDashbordTeam(dto: TeamMemberDto): Promise<any> {
//     const { memberId } = dto;

//     try {
//       const kpis = await this.kpiModel.find({ 'ownerId.id': memberId }).exec();
//       return {
//         success: true,
//         count: kpis.length,
//         data: kpis,
//       };
//     } catch (error) {
//       return {
//         success: false,
//         message: 'Failed to fetch KPIs for member',
//         error: error.message,
//       };
//     }
//   }
// }

@Injectable()
export class TeamByIdService {
  constructor(@InjectModel(Kpi.name) private kpiModel: Model<Kpi>) {}

  async getDashbordTeam(dto: TeamMemberDto): Promise<any> {
    const { memberId } = dto;

    // Ensure memberId is an array
    if (!Array.isArray(memberId) || memberId.length === 0) {
      return {
        success: false,
        message: 'memberId must be a non-empty array of strings.',
      };
    }

    try {
      const kpis = await this.kpiModel
        .find({ 'ownerId.id': { $in: memberId } })
        .exec();

      return {
        success: true,
        count: kpis.length,
        data: kpis,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch KPIs for members',
        error: error.message,
      };
    }
  }
}

