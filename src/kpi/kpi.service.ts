import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { isValidObjectId, Model, Types } from 'mongoose';
import { Permission } from 'src/permissions/permissions.enum';
import { PermissionsService } from 'src/permissions/permissions.service';
import { Quarter, QuarterDocument } from 'src/quarter/entities/quarter.schema';
import { Team } from 'src/teams/entities/team.entity';
import { KpiQueryDto } from './dto/kpi-query.dto.';
import { Kpi } from './entities/kpi.entity';
import { UpdateKpiDto } from './dto/update-kpi.dto';
import { UpdateIntervalBreakdownDto } from './dto/update-interval-breakdown.dto';
import { User } from 'src/users/entities/user.entity';
import { EmailService } from 'src/mail-send/mail.service';

@Injectable()
export class KpiService {
  constructor(
    @InjectModel(Kpi.name) private kpiModel: Model<Kpi>,
    @InjectModel(Team.name) private teamModel: Model<Team>,
    @InjectModel(Quarter.name) private QuatersModule: Model<QuarterDocument>,
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly permissionsService: PermissionsService,
    private readonly emailService: EmailService
  ) {}

 private async getIntervalsLeft(data: any) {
   
    let quarterEnd= new Date(data.quarterEndDate);
    const now = new Date();
    const daysLeft = Math.max(
      0,
      Math.ceil((quarterEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) // Convert ms to days
    );
  const left =`${Math.ceil(daysLeft / 7)} weeks left`;

    return left
  }

private async qtdAchieved(data:any){

      const {divisionType,breakdownData,initialCurrentValue}=data

    let  qtdAchieved = 0
    const now = new Date(); // March 25, 2025
      const  quarterStart =new Date(data.quarterStartDate)
    
    const daysSinceQuarterStart = Math.floor(
      (now.getTime() - quarterStart.getTime()) / (1000 * 60 * 60 * 24),
    );
    const currentWeekIndex = Math.floor(daysSinceQuarterStart / 7)-1;
  
    if (divisionType === 'cumulative') {

      breakdownData.forEach((interval, index) => {
        const achieved = parseFloat(interval.intervalContribution) || 0;

        if (index <= currentWeekIndex) {
          qtdAchieved += achieved;
        }
      });
       qtdAchieved+=initialCurrentValue
    } else if (divisionType === 'standalone') {
      // Calculate weeks with both target and contribution > 0
      const weeksWithNonZeroValues = breakdownData.filter((interval) => {
        const target = parseFloat(interval.intervalTarget);
        const contribution = parseFloat(interval.intervalContribution);
        const isUpdated=interval?.isUpdated || false
        return (target > 0 && contribution && isUpdated);
      }).length;

      const { targetSum, currentSum } = breakdownData
        .slice(0, currentWeekIndex + 1)
        .reduce(
          (acc, interval) => ({
            targetSum:
              acc.targetSum + (parseFloat(interval.intervalTarget) || 0),
            currentSum:
              acc.currentSum + (parseFloat(interval.intervalContribution) || 0),
          }),
          { targetSum: 0, currentSum: 0 },
        );

    
      const Achieved = Number(currentSum / weeksWithNonZeroValues);
      // QTD calculations
      qtdAchieved = isNaN(Achieved) ? 0 : Achieved; // Direct cumulative sum, not divided by weeks

      const achievedValue = Number(Achieved) || 0;
        const initialValue = Number(initialCurrentValue) || 0;
       qtdAchieved = achievedValue + initialValue;
     
    }

    return qtdAchieved
}  
  async calculateKpi(data) {

   const {divisionType,breakdownData, targetValue,initialCurrentValue}=data

    const now = new Date(); // March 25, 2025
     const  quarterStart =new Date(data.quarterStartDate)
    
    const daysSinceQuarterStart = Math.floor(
      (now.getTime() - quarterStart.getTime()) / (1000 * 60 * 60 * 24),
    );
    const currentWeekIndex = Math.floor(daysSinceQuarterStart / 7)-1;
 
    const intervalsLeft = await this.getIntervalsLeft(data);

    let quarterlyGoal = 0,
      qtdGoal = 0,
      goalAchieved = 0,
      qtdAchieved = 0,
      weeklyGoal = 0,
      currentWeekAchieved = 0,
      currentWeek=breakdownData[currentWeekIndex+1]?.intervalName || "" ;

    if (divisionType === 'cumulative') {

      quarterlyGoal = Number(targetValue);

      breakdownData.forEach((interval, index) => {
        const target = parseFloat(interval.intervalTarget) || 0;
        const achieved = parseFloat(interval.intervalContribution) || 0;

        if (index <= currentWeekIndex) {
          qtdGoal += target;
          goalAchieved += achieved;
          qtdAchieved += achieved;
        }
        if (index === currentWeekIndex) {
          weeklyGoal += target;
          currentWeekAchieved += achieved;
        }
      });
       qtdAchieved+=initialCurrentValue
    } else if (divisionType === 'standalone') {
      // Calculate weeks with both target and contribution > 0
      const weeksWithNonZeroValues = breakdownData.filter((interval) => {
        const target = parseFloat(interval.intervalTarget);
        const contribution = parseFloat(interval.intervalContribution);
        const isUpdated=interval?.isUpdated || false
        return (target > 0 && contribution && isUpdated);
      }).length;

      const { targetSum, currentSum } = breakdownData
        .slice(0, currentWeekIndex + 1)
        .reduce(
          (acc, interval) => ({
            targetSum:
              acc.targetSum + (parseFloat(interval.intervalTarget) || 0),
            currentSum:
              acc.currentSum + (parseFloat(interval.intervalContribution) || 0),
          }),
          { targetSum: 0, currentSum: 0 },
        );

      // Set quarterly goal (fixed value from targetSum)
      quarterlyGoal = targetValue;

      weeklyGoal = Number(
        breakdownData[currentWeekIndex]?.intervalTarget || 0,
      );
   
      // Get the current week's contribution directly
      const currentWeekContribution =
        breakdownData[currentWeekIndex]?.intervalContribution;
      currentWeekAchieved = Number(
        parseFloat(currentWeekContribution) || 0,
      );

      const Achieved = Number(currentSum / weeksWithNonZeroValues);
      // QTD calculations
      qtdGoal = targetValue; // Use cumulative target sum instead of fixed value
      qtdAchieved = isNaN(Achieved) ? 0 : Achieved; // Direct cumulative sum, not divided by weeks

      const achievedValue = Number(Achieved) || 0;
        const initialValue = Number(initialCurrentValue) || 0;
       qtdAchieved = achievedValue + initialValue;
     
    }

    return {
      quarterlyGoal,
      qtdGoal,
      qtdAchieved,
      weeklyGoal,
      goalAchieved,
       currentWeek,
      currentWeekAchieved,
      intervalsLeft: `${intervalsLeft}`,
    };
  }

private async generateParentBreakdownData(childKpis) {
  return childKpis[0]?.intervalBreakDown.map((_, index) => {
    const { intervalIndex, intervalName, startDate, endDate } = childKpis[0].intervalBreakDown[index];

    const { totalTarget, totalContribution } = childKpis.reduce(
      (acc, kpi) => {
        const interval = kpi.intervalBreakDown[index];
        acc.totalTarget += interval.intervalTarget;
        acc.totalContribution += interval.intervalContribution;
        return acc;
      },
      { totalTarget: 0, totalContribution: 0 },
    );

    return {
      intervalIndex,
      intervalName,
      startDate,
      endDate,
      intervalContribution:totalContribution ,
      intervalTarget:totalTarget ,
    };
  });
}

private async buildBaseKpi(dto: any, breakdownData: any[]) {
  const createdBy = new Types.ObjectId(dto.userId);

  const kpi = new this.kpiModel({
    name: dto.name,
    parentKpiId: dto.parentKpiId ? new Types.ObjectId(dto.parentKpiId) : null,
    description: dto.description || '',
    ownerId: dto.ownerId,
    measurementUnit: dto.measurementUnit || 'number',
    targetValue: dto.targetValue,
    currentValue: dto.currentValue || 0,
    divisionType: dto.divisionType || 'cumulative',
    quarter: dto.quarter,
    quarterStartDate: dto.quarterStartDate,
    quarterEndDate: dto.quarterEndDate,
    contribution: dto.contribution,
    frequency: dto.frequency,
    breakdownData,
    kpiType: dto.kpiType,
    organizationId: dto.organizationId,
    remainingContribution: dto.remainingContribution,
    currencyType: dto.currencyType,
    initialCurrentValue: dto.initialCurrentValue,
    initialTargetValue: dto.initialTargetValue,
    createdBy,
  });

  if (dto.kpiType === 'team' && dto.teamId) {
    kpi.teamId = { id: dto.teamId.id, name: dto.teamId.name };
  }
  if (dto.kpiType === 'company' && dto.teamIds) {
    kpi.teamIds = dto.teamIds;
  }

  return kpi;
}

private async createTeamKpisForCompany(savedKpi: Kpi, dto: any) {
  const teamKpisInfo = await Promise.all(
    dto.childKpis.map(async (childKpi) => {
      const team = await this.teamModel.findById(childKpi.id);
      const owner = {
        id: team.owner.id.toString(),
        name: team.owner.name,
      };

      const targetValue = childKpi.intervalBreakDown.reduce(
        (sum, interval) => sum + (parseFloat(interval.intervalTarget) || 0),
        0,
      );

      const teamKpiData = {
        name: childKpi.kpiName,
        description: savedKpi.description,
        ownerId: owner,
        measurementUnit: savedKpi.measurementUnit,
        targetValue: savedKpi.divisionType === 'standalone' ? savedKpi.targetValue : targetValue,
        initialTargetValue: savedKpi.divisionType === 'standalone' ? savedKpi.targetValue : targetValue,
        divisionType: savedKpi.divisionType,
        quarter: savedKpi.quarter,
        quarterStartDate: savedKpi.quarterStartDate,
        quarterEndDate: savedKpi.quarterEndDate,
        frequency: savedKpi.frequency,
        currencyType: savedKpi.currencyType,
        kpiType: 'team',
        teamId: { id: childKpi.id, name: childKpi.name },
        breakdownData: childKpi.intervalBreakDown,
        parentKpiId: savedKpi._id,
        parentKpiName: savedKpi.name,
        organizationId: savedKpi.organizationId,
        createdBy: savedKpi.createdBy,
        contribution: childKpi.contribution || 0,
        remainingContribution: childKpi.remainingContribution || 0,
      };

      const teamKpi = await this.kpiModel.create(teamKpiData);
      childKpi.kpiId = teamKpi._id.toString();

      return {
        id: teamKpi.teamId.id,
        kpiId: teamKpi._id,
        name: teamKpi.teamId.name,
        kpiName: teamKpi.name,
      };
    }),
  );

  savedKpi.childKpis = teamKpisInfo;
  savedKpi.markModified('childKpis');
  savedKpi.markModified('breakdownData');
  await savedKpi.save();
}

private async createIndividualKpisForTeam(savedKpi: Kpi, dto: any) {
  if (!dto.assigneeIds || !dto.childKpis) return;

  savedKpi.assigneeIds = dto.assigneeIds;

  const individualKpis = await Promise.all(
    dto.assigneeIds.map(async (assignee) => {
      
      const child = dto.childKpis.find((c) => c.id === assignee.id);
      if (!child) throw new Error(`Missing breakdown for ${assignee.name}`);

      const targetValue = child.intervalBreakDown.reduce(
        (sum, interval) => sum + (parseFloat(interval.intervalTarget) || 0),
        0,
      );

      const individualKpi = await this.kpiModel.create({
        name: child.kpiName || savedKpi.name,
        description: savedKpi.description,
        ownerId: { id: assignee.id, name: assignee.name },
        measurementUnit: savedKpi.measurementUnit,
        targetValue: savedKpi.divisionType === 'standalone' ? savedKpi.targetValue : targetValue,
        initialTargetValue: savedKpi.divisionType === 'standalone' ? savedKpi.targetValue : targetValue,
        divisionType: savedKpi.divisionType,
        quarter: savedKpi.quarter,
        quarterStartDate: savedKpi.quarterStartDate,
        quarterEndDate: savedKpi.quarterEndDate,
        frequency: savedKpi.frequency,
        currencyType: savedKpi.currencyType,
        kpiType: 'individual',
        teamId: savedKpi.teamId,
        assigneeIds: [assignee],
        breakdownData: child.intervalBreakDown,
        parentKpiId: savedKpi._id,
        parentKpiName: savedKpi.name,
        organizationId: savedKpi.organizationId,
        contribution: child.contribution || 0,
        remainingContribution: child.remainingContribution || 0,
        createdBy: savedKpi.createdBy,
      });

      return {
        id: individualKpi.ownerId.id.toString(),
        kpiId: individualKpi._id,
        name: assignee.name,
        kpiName: individualKpi.name,
      };
    }),
  );

  savedKpi.childKpis = individualKpis;
  savedKpi.markModified('childKpis');
  savedKpi.markModified('breakdownData');
  await savedKpi.save();
}

private shouldGenerateParentBreakdown(dto: any): boolean {
  return (
    (dto.kpiType === 'team' && dto.teamId) ||
    (dto.kpiType === 'company' && dto.teamIds)
  );
}

  private convertToUTCDate(dateStr: string): string {
    const localDate = new Date(dateStr); // parse local time
    const utcDate = new Date(Date.UTC(
      localDate.getFullYear(),
      localDate.getMonth(),
      localDate.getDate()
    ));
    return utcDate.toISOString(); // gives 'YYYY-MM-DDT00:00:00.000Z'
  }
  async create(createKpiDto: any): Promise<Kpi> {
    try {
        let breakdownDataKpi = await this.shouldGenerateParentBreakdown(createKpiDto)
      ? await this.generateParentBreakdownData(createKpiDto.childKpis)
      : createKpiDto.breakdownData || [];

   const kpi = await this.buildBaseKpi(createKpiDto, breakdownDataKpi);
      const savedKpi = await kpi.save();

      if (
        ['individual', 'team'].includes(savedKpi.kpiType) &&
        savedKpi.parentKpiId
      ) {
        await this.linkKpiToParent(
          savedKpi._id.toString(),
          savedKpi.parentKpiId.toString(),
          savedKpi.kpiType as 'individual' | 'team',
          savedKpi.kpiType === 'individual' ? 'team' : 'company',

        );
      }
      // Company KPI: Generate Team KPIs
      if (savedKpi.kpiType === 'company') {
         await this.createTeamKpisForCompany(savedKpi, createKpiDto);
      } 
      // Team KPI: Generate Individual KPIs
      else if (savedKpi.kpiType === 'team') {

         await this.createIndividualKpisForTeam(savedKpi, createKpiDto);
      }

      return savedKpi;
    } catch (error) {
      console.error('Error creating KPI:', error);
      throw error;
    }
  }

  async findAll(
    orgId: any,
    userId: any,
    KpiQueryDto: KpiQueryDto,
  ): Promise<any> {
    try {
    const {
      kpiType,
      page = 1,
      limit = 10,
      // additionalDetails = true,
      search = "",
      filters = {},
      sortBy,
    } = KpiQueryDto;
    const skip = (page - 1) * limit;

    // Build base query
    const query: any = { organizationId: orgId,
    };
      
    if (kpiType) query.kpiType = kpiType;

    // if (!filters.ownerId || !Array.isArray(filters.ownerId) || filters?.ownerId?.length === 0) {
    //   filters.ownerId = [userId];
    // }
    if (filters.ownerId?.length) {
      if (kpiType === 'individual') {
        // For individual KPIs, filter by ownerId.id (strings)
        query["ownerId.id"] = { $in: filters.ownerId };
      } else if (kpiType === 'team' || kpiType === 'company') {
        // For team and company KPIs, convert string IDs to ObjectIds and filter by createdBy
        const objectIdOwnerIds = filters.ownerId.map(id => new mongoose.Types.ObjectId(id));
        query["createdBy"] = { $in: objectIdOwnerIds };
      }
    }

    // Handle quarter filter
    if (filters.quarter?.length) {
      query["quarter"] = { $in: filters.quarter };
    }

    if (search && search.trim() !== "") {
      query.$text = { $search: search.trim() };
    }

    let sortOptions: any = { createdAt: -1 }; // default sort

    if (sortBy?.field && sortBy?.order) {
      sortOptions = {
        [sortBy.field]: sortBy.order === 'asc' ? 1 : -1
      };
      if (sortBy?.field == "ownerId.name") {
        sortOptions = {
          [sortBy.field]: sortBy.order === 'desc' ? 1 : -1
        }
      };
    }

    // const [canViewAll, canViewTeam, canViewIndividual] = await Promise.all([
    //   this.permissionsService.hasAnyPermission(userId, orgId, [
    //     Permission.VIEW_ALL_KPI,
    //   ]),
    //   this.permissionsService.hasAnyPermission(userId, orgId, [
    //     Permission.VIEW_TEAM_KPI,
    //   ]),
    //   this.permissionsService.hasAnyPermission(userId, orgId, [
    //     Permission.VIEW_INDIVIDUAL_KPI,
    //   ]),
    // ]);

    // // If user can view all KPIs, no additional filters needed
    // if (!canViewAll) {
    //   const orConditions: any[] = [];
    //   if (canViewTeam) {
    //     orConditions.push(
    //       // { 'ownerId.id': userId },
    //       // { 'createdBy': userId },
    //       // { 'assigneeIds.id': userId, kpiType: { $ne: 'company' } },
    //     );
    //   }
    //   if (canViewIndividual) {
    //     orConditions.push(
    //       // { 'ownerId.id': userId },
    //       // { 'createdBy': userId },
    //       // { 'assigneeIds.id': userId },
    //       // { 'role': role}
    //     );
    //   }
    //   const uniqueOrConditions = orConditions.filter(
    //     (condition, index, self) =>
    //       index ===
    //       self.findIndex(
    //         (c) => JSON.stringify(c) === JSON.stringify(condition),
    //       ),
    //   );
    //   if (uniqueOrConditions.length > 0) {
    //     query.$or = uniqueOrConditions;
    //   } else {
    //      return {
    //       status: "success",
    //       statusCode: 200,
    //       message: "No KPIs found for the user with given permissions.",
    //       data: [],
    //       pagination: {
    //         currentPage: 0,
    //         pageSize: limit,
    //         totalPages: 0,
    //         totalRecords: 0,
    //       },
    //     };
    //   }
    // }
    // Get paginated results    
    // const [kpis, total] = await Promise.all([
    //   this.kpiModel
    //     .find(query)
    //     .sort(sortOptions)
    //     .skip(skip)
    //     // .select(fieldsToSelect)
    //     .limit(limit)
    //     .lean()
    //     .exec(),
    //   this.kpiModel.countDocuments(query).exec(),
    // ]);

    const pipeline: any[] = [
      { $match: query },
      { $sort: { 'ownerId.name': 1, createdAt: -1 } }, // sort alphabetically by owner name
      {
        $facet: {
          paginatedResults: [
            { $skip: skip },
            { $limit: limit },
          ],
          totalCount: [
            { $count: 'count' }
          ]
        }
      }
    ];

    const result = await this.kpiModel.aggregate(pipeline).exec();
    const kpis = result[0]?.paginatedResults || [];
    const total = result[0]?.totalCount?.[0]?.count || 0;

    const totalPages = Math.ceil(total / limit);
    if (kpis) {
      const detailedKpis =await Promise.all(
        kpis.map(async (item: any) => {
          if (item.kpiType === 'individual') {
            if (item.parentKpiId) {
              const parentKpi = await this.kpiModel
                .findById(item.parentKpiId)
                .exec();
              if (parentKpi) {
                item.parentKpiName = parentKpi.name;
              }
            }
            item.intervalsLeft = await this.getIntervalsLeft(item);
            item.qtdAchieved=await this.qtdAchieved(item)
            return item; // ✅ Important: return individual item
          }
          if (item.kpiType === 'team') {
            const [individualKpis, newTeamKpi] = await Promise.all([
              this.kpiModel
                .find({ parentKpiId: item._id, kpiType: 'individual' })
                .lean()
                .exec(),
              this.kpiModel
                .findById(item._id)
                .populate('teamIds.id')
                .lean()
                .exec(),
            ]);
            const intervalsLeft =await this.getIntervalsLeft(item);
            const qtdAchieved=await this.qtdAchieved(item)
           await Promise.all(
            individualKpis.map(async (item: any) => {
              item.qtdAchieved = await this.qtdAchieved(item);
            })
          );
            return {
              ...newTeamKpi,
              childKpis: individualKpis,
              intervalsLeft,
              qtdAchieved
            };
          }
          if (item.kpiType === 'company') {
            // Fetch team KPIs under the company KPI
            const teamKpis = await this.kpiModel
              .find({ parentKpiId: item._id, kpiType: 'team' })
              .lean()
              .exec();
            const populatedTeamKpis = await Promise.all(
              teamKpis.map(async (teamKpi) => {
                const populatedTeamKpi = await this.kpiModel
                  .findById(teamKpi._id)
                  .populate('teamIds.id')
                  .lean()
                  .exec();
                return populatedTeamKpi;
              }),
            );
            const intervalsLeft =await this.getIntervalsLeft(item);
            const qtdAchieved=await this.qtdAchieved(item)
             await Promise.all(
            teamKpis.map(async (item: any) => {
              item.qtdAchieved = await this.qtdAchieved(item);
            })
          );
            return {
              ...item,
              childKpis: populatedTeamKpis,
              intervalsLeft,
              qtdAchieved
            };
          }
          return item; // For 'company' or other KPI types
        }),
      );
      return {
        status: "success",
        statusCode: 200,
        message: "KPIs fetched successfully.",
        data: detailedKpis,
        pagination: {
          currentPage:Number(page),
          pageSize: Number(limit),
          totalPages,
          totalRecords: total,
        },
      }
    }
    } catch (error) {
    return {
      status: "error",
      statusCode: 500,
      message: "Internal server error.",
      error: error.message || error.toString(),
      data: [],
      pagination: {
        currentPage: 0,
        pageSize: 0,
        totalPages: 0,
        totalRecords: 0,
      },
    };
    }
  }

  async findAllByType(orgId: any, userId: any, kpiType: string): Promise<any> {
    try {
      const query: any = { organizationId: orgId };
      if (kpiType) query.kpiType = kpiType;
      const fieldsToSelect = {
        _id: 1,
        name: 1,
        kpiType: 1,
        targetValue: 1,
        teamIds: 1,
        ownerId: 1,
        frequency: 1,
        measurementUnit: 1,
        divisionType: 1,
        quarter: 1,
        quarterEndDate: 1,
        quarterStartDate: 1,
        assigneeIds: 1,
      };
      
      const [kpis, total] = await Promise.all([
        this.kpiModel
          .find(query)
          .sort({ createdAt: -1 })
          .select(fieldsToSelect)
          .lean()
          .exec(),
        this.kpiModel.countDocuments(query).exec(),
      ]);
      
      return {
        status: "success",
        statusCode: 200,
        message: "KPIs fetched successfully.",
        data: kpis,
        total: total,
      };
    } catch (error) {
      return {
        status: "error",
        statusCode: 500,
        message: "Internal server error.",
        error: error.message || error.toString(),
        data: [],
      };
    }
  }

  async findOneKPI(id: string): Promise<any> {
    const data: any = await this.kpiModel.findById(id).lean().populate([
      { path: 'createdBy', select: 'name' },
      { path: 'lastUpdatedBy', select: 'name' }
    ]).exec();
    if (!data) return null;

    // Format ownerId properly
    if (data.ownerId) {
      if (
        typeof data.ownerId.id === 'string' &&
        data.ownerId.id.includes('{')
      ) {
        try {
          const match = data.ownerId.id.match(/id:\s*['"]([^'"]+)['"]/);
          if (match && match[1]) {
            data.ownerId = {
              id: match[1],
              name: data.ownerId.name,
            };
          }
        } catch (e) {
          console.error('Error parsing ownerId:', e);
        }
      } else if (typeof data.ownerId.id === 'object') {
        data.ownerId = {
          id: data.ownerId.id.toString(),
          name: data.ownerId.name,
        };
      }
    }

    // Add calculated KPI metrics
    const kpiData = await this.calculateKpi(data);
    data.quarterlyGoal = Number(kpiData.quarterlyGoal);
    data.qtdGoal = Number(kpiData.qtdGoal);
    data.qtdAchieved = Number(kpiData.qtdAchieved);
    data.weeklyGoal = Number(kpiData.weeklyGoal);
    data.intervalsLeft = kpiData.intervalsLeft;
    data.goalAchieved = Number(kpiData.goalAchieved);
    data.currentWeekAchieved = Number(kpiData.currentWeekAchieved);
    data.currentWeek=kpiData.currentWeek

    // Enrich KPI based on type
    if (data.kpiType === 'individual') {
      let parentKpiDetails = {};
      if (data.parentKpiId) {
        const parentKpi = await this.kpiModel
          .findById(data.parentKpiId)
          .lean()
          .exec();
        if (parentKpi) {
          parentKpiDetails = {
            parentKpiId: parentKpi._id,
            parentKpiName: parentKpi.name,
          };
        }
      }

      return {
        ...data,
        ...parentKpiDetails,
      };
    }

    if (data.kpiType === 'team') {
      // Fetch full child KPI documents
      data.childKpis = await this.kpiModel
        .find({
          parentKpiId: data._id,
          kpiType: 'individual',
        })
        .lean()
        .exec();

      const populatedTeam = await this.kpiModel
        .findById(data._id)
        .populate('teamIds.id') // Adjust this path based on your schema
        .lean()
        .exec();

        data.childKpis= await Promise.all(
            data.childKpis.map(async (item: any) => {
              item.qtdAchieved = await this.qtdAchieved(item);
              return item
            })
          );

      return {
        ...populatedTeam,
        ...data, // Merge calculated fields like weeklyGoal etc.
      };
    }

    if (data.kpiType === 'company') {
      // Add any additional logic for company KPIs here
      const teamKpis = await this.kpiModel
        .find({ parentKpiId: data._id, kpiType: 'team' })
        .lean()
        .exec();
    
      // Populate teamIds.id for each team KPI
      const populatedTeamKpis = await Promise.all(
        teamKpis.map(async (teamKpi) => {
          const populatedTeamKpi = await this.kpiModel
            .findById(teamKpi._id)
            .populate('teamIds.id')
            .lean()
            .exec();
          return populatedTeamKpi;
        }),
      );
       const finalTeamKpis = await Promise.all(
    populatedTeamKpis.map(async (item: any) => {
      item.qtdAchieved = await this.qtdAchieved(item);
      return item;
    })
  );
      return {
        ...data,
        childKpis: finalTeamKpis,
      };
    }

    return data;
  }

  //this is for update kpis
  async updateKpiDetails(kpiId: string, updateKpiDto: UpdateKpiDto): Promise<any> {
    const existingKpi = await this.kpiModel.findById(kpiId).exec();
    if (!existingKpi) throw new Error('KPI not found');

    const updatedChildKpisFromClient = updateKpiDto.childKpis || [];
    const assigneeIdMap: Map<string, string> = new Map<string, string>(
      (updateKpiDto.assigneeIds || []).map(
        (a: { id: string; name: string }) => [a.id, a.name],
      ),
    );

    const checkParentIdExist=existingKpi.parentKpiId? true:false
    await this.updateParentKpiBrackdown(kpiId, updateKpiDto,checkParentIdExist);

    if (existingKpi.kpiType === 'team') {
      await this.handleUpdateTeamKpi(
        kpiId,
        existingKpi,
        updateKpiDto,
        updatedChildKpisFromClient,
        assigneeIdMap,
      );
    } else if (existingKpi.kpiType === 'individual') {
      await this.handleUpdateIndividualKpi(kpiId, updateKpiDto);
      const ownerMail = await this.userModel.findById(new Types.ObjectId(existingKpi?.ownerId?.id)).exec();
      console.log(ownerMail.name, ownerMail.email);
        let mailObject = {
          recipients: [ownerMail.email],    // Actual Mail Id
          // recipients: ['kirado9833@ofacer.com', 'akashsunhare2@gmail.com'],     // Testing
          subject: "Update KPI",
          data: ownerMail.name
        }
        // this.emailService.updatePrioritiesEmail(mailObject);
    } else if (existingKpi.kpiType === 'company') {
      await this.handleUpdateCompanyKpi(kpiId, existingKpi, updateKpiDto);
    }
  }

  private async updateParentKpiBrackdown(id: string, updateKpiDto: any, checkParentIdExist:boolean) {
    if (updateKpiDto?.breakdownData?.length > 0 || updateKpiDto?.childKpis?.length>0 ) {
       if (
        ['individual', 'team'].includes(updateKpiDto.kpiType) &&
        updateKpiDto.parentKpiId && !checkParentIdExist
      ) {
        await this.linkKpiToParent(
          updateKpiDto._id.toString(),
          updateKpiDto.parentKpiId.toString(),
          updateKpiDto.kpiType as 'individual' | 'team',
          updateKpiDto.kpiType === 'individual' ? 'team' : 'company',

        );
      }
 let breakdownDataKpi = await this.shouldGenerateParentBreakdown(updateKpiDto)
      ? await this.generateParentBreakdownData(updateKpiDto.childKpis)
      : updateKpiDto.breakdownData || [];
      await this.kpiModel.findByIdAndUpdate(id, {
        ...updateKpiDto,
        ...(updateKpiDto.parentKpiId && {
          parentKpiId :new Types.ObjectId(updateKpiDto.parentKpiId)
        }),
        ...((updateKpiDto.breakdownData|| updateKpiDto.childKpis) && {
          breakdownData: breakdownDataKpi,
        }),
        ...(updateKpiDto.targetValue !== undefined && {
          targetValue: updateKpiDto.targetValue,
        }), // Update targetValue if provided
      });
    }
  }

  //this is for update
  private async handleUpdateTeamKpi(
    teamKpiId: string,
    existingKpi: any,
    updateKpiDto: any,
    updatedChildKpis: any[],
    assigneeIdMap: Map<string, string>,
  ) {
    const existingChildKpis = await this.kpiModel.find({
      parentKpiId: new Types.ObjectId(teamKpiId),
    });
    const existingChildAssigneeIds = new Set<string>(
      existingChildKpis.map((k) => k.ownerId.id),
    );
    const updateAssigneeIds = new Set<string>(
      updateKpiDto.assigneeIds.map((a: any) => a.id),
    );

    const toDelete = [...existingChildAssigneeIds].filter(
      (id) => !updateAssigneeIds.has(id),
    );
    const toCreate = [...updateAssigneeIds].filter(
      (id) => !existingChildAssigneeIds.has(id),
    );
    const toUpdate = [...existingChildAssigneeIds].filter((id) =>
      updateAssigneeIds.has(id),
    );

    await this.kpiModel.deleteMany({
      parentKpiId: new Types.ObjectId(teamKpiId),
      'ownerId.id': { $in: toDelete },
    });

    for (const childId of toUpdate) {
      const existingIndividualData = updatedChildKpis.find(
        (child) => child.id === childId,
      );
      const updatedIndividualData = updateKpiDto.childKpis.find(
        (c: any) => c.id === childId,
      );

      if (existingIndividualData && updatedIndividualData) {
        const totalTarget = updatedIndividualData.intervalBreakDown.reduce(
          (sum: any, interval: any) => {
            const intervalTarget = Number(interval.intervalTarget);
            return sum + intervalTarget;
          },
          0,
        );

        await this.kpiModel.findOneAndUpdate(
          { parentKpiId: new Types.ObjectId(teamKpiId), 'ownerId.id': childId },
          {
            name: updatedIndividualData.kpiName,
            targetValue:
              existingKpi.divisionType == 'standalone'
                ? updateKpiDto.targetValue
                : totalTarget,
            initialTargetValue:
              existingKpi.divisionType == 'standalone'
                ? updateKpiDto.targetValue
                : totalTarget,
            contribution: updatedIndividualData.contribution,
            breakdownData: updatedIndividualData.intervalBreakDown,
          },
          { new: true },
        );
      }
    }

    for (const childId of toCreate) {
      const childData = updatedChildKpis.find((child) => child.id === childId);
      if (childData) {
        const totalTarget = childData.intervalBreakDown.reduce(
          (sum: any, interval: any) => {
            const intervalTarget = Number(interval.intervalTarget);
            return sum + intervalTarget;
          },
          0,)
        await this.kpiModel.create({
          name: childData.kpiName,
          parentKpiId: new Types.ObjectId(teamKpiId),
          parentKpiName: existingKpi.name,
          organizationId: existingKpi.organizationId,
          measurementUnit: existingKpi.measurementUnit,
          currencyType: existingKpi.currencyType,
          targetValue:
            existingKpi.divisionType == 'standalone'
              ? existingKpi.targetValue
              : totalTarget,
           currentValue: 0,
          initialTargetValue:totalTarget,
          contribution: childData.contribution,
          frequency: childData.frequency,
          ownerId: {
            id: childId,
            name: childData.name || assigneeIdMap.get(childId),
          },
          createdBy: existingKpi.createdBy,
          teamId: existingKpi.teamId,
          teamIds: existingKpi.teamIds,
          quarter: existingKpi.quarter,
          quarterStartDate:existingKpi.quarterStartDate,
          quarterEndDate:existingKpi.quarterEndDate,
          breakdownData: childData.intervalBreakDown,
          kpiType: 'individual',
          divisionType: existingKpi.divisionType,
        });
      }
    }

    const finalChildKpis = await this.kpiModel
      .find({ parentKpiId:new Types.ObjectId(teamKpiId) })
      .lean();

    const updatedChildKpiInfo = finalChildKpis.map((k) => ({
      id: k.ownerId.id,
      name: k.ownerId.name,
      kpiName: k.name || '',
      kpiId: k._id,
    }));
    const updatedAssignees = Array.from(
      new Map(
        updatedChildKpiInfo.map((k) => [k.id, { id: k.id, name: k.name }]),
      ).values(),
    );
    await this.kpiModel.findByIdAndUpdate(teamKpiId, {
      name: updateKpiDto?.name,
      childKpis: updatedChildKpiInfo,
      assigneeIds: updatedAssignees,
    });
  }

  private async handleUpdateIndividualKpi(id: string, updateKpiDto: any) {
    await this.kpiModel.findByIdAndUpdate(id, {
      ...updateKpiDto,
       ...(updateKpiDto.parentKpiId && {
          parentKpiId :new Types.ObjectId(updateKpiDto.parentKpiId)
        }),
    });
  }

  private async handleUpdateCompanyKpi(
    companyKpiId: string,
    existingKp1: any,
    updateKpiDto: any,
  ) {
    
     const existingKpi = await this.kpiModel.findById(companyKpiId).exec();
   
    // Get existing team KPIs
    const existingTeamKpis = await this.kpiModel.find({
      parentKpiId: new Types.ObjectId(companyKpiId),
    });
    const existingTeamIds = new Set<string>(
      existingTeamKpis.map((k) => k.teamId.id),
    );
    const updateTeamIds = new Set<string>(
      updateKpiDto.teamIds.map((t: any) => t.id),
    );

    // Identify teams to delete and create
    const toDelete = [...existingTeamIds].filter(
      (id) => !updateTeamIds.has(id),
    );
    const toCreate = [...updateTeamIds].filter(
      (id) => !existingTeamIds.has(id),
    );
    const toUpdate = [...existingTeamIds].filter((id) => updateTeamIds.has(id));
    // Delete removed teams
    if (toDelete.length > 0) {
      await this.kpiModel.deleteMany({
        parentKpiId: new Types.ObjectId(companyKpiId),
        teamId: { $in: toDelete },
      });
    }

    // Update existing team KPIs
    for (const teamId of toUpdate) {
      const existingTeamData = existingTeamKpis.find(
        (kpi) => kpi.teamId.id === teamId,
      );
      const updatedTeamData = updateKpiDto.childKpis.find(
        (c: any) => c.id === teamId,
      );

      if (existingTeamData && updatedTeamData) {
        const totalTarget = updatedTeamData.intervalBreakDown.reduce(
          (sum: any, interval: any) => {
            const intervalTarget = Number(interval.intervalTarget);
            return sum + intervalTarget;
          },
          0,
        );

        // Update the existing team KPI with new data
        const updatedKpi = {
          ...existingTeamData.toObject(),
          targetValue:
            existingKpi.divisionType == 'standalone'
              ? updateKpiDto.targetValue
              : totalTarget,
            initialTargetValue:
              existingKpi.divisionType == 'standalone'
                ? updateKpiDto.targetValue
                : totalTarget,   
          name: updatedTeamData.kpiName,
          contribution: updatedTeamData.contribution,
          frequency: updatedTeamData.frequency,
          ownerId: updatedTeamData.ownerId || existingTeamData.ownerId, // Fallback to existing owner if not specified
          breakdownData: updatedTeamData.intervalBreakDown,
        };
       if (updateKpiDto?.userId) {
        updatedKpi.lastUpdatedBy = new Types.ObjectId(updateKpiDto.userId) 
}
      const a = await this.kpiModel.findByIdAndUpdate(
  existingTeamData._id,
  updatedKpi,
  { new: true }
);

const childKpiUpdate = await this.kpiModel.find({ parentKpiId: a._id }).exec();
const divideChild = a.targetValue / (childKpiUpdate.length || 1);

// const updatedChildren = await Promise.all(
//   childKpiUpdate.map(async (child: any) => {
//     if (a._id.toString() === child.parentKpiId.toString()) {
//       const now = new Date();

//       const remainingIntervals = child.breakdownData.filter(interval => {
//         const end = new Date(interval.endDate);
//         return now <= end;
//       });

//       const sumBeforeToday = child.breakdownData
//         .filter(interval => new Date(interval.endDate) < now)
//         .reduce((sum, interval) => sum + interval.intervalTarget, 0);

//       const newTargetValue = divideChild - sumBeforeToday;

//       const intervalCount = remainingIntervals.length;
//       if (intervalCount === 0) {
//         return await this.kpiModel.findByIdAndUpdate(
//           child._id,
//           {
//             targetValue: divideChild,
//             initialTargetValue: divideChild,
//             breakdownData: child.breakdownData,
//           },
//           { new: true }
//         );
//       }

//       // Rounded effective target per interval
//       const effectiveTargetvalue=newTargetValue / intervalCount
      

//       const updatedBreakdownData = child.breakdownData.map(interval => {
//         const baseValue = Math.floor(Number(effectiveTargetvalue)); // round down to 2 decimal places
//       let decimalValue=Number(effectiveTargetvalue)-baseValue
//       let remainingSum = +decimalValue
      
//         const end = new Date(interval.endDate);
//         if (now <= end) {
//           let updatedTarget = baseValue;

//           // If it's the last interval in the remaining set, add the leftover
//           if (
//             interval.intervalIndex ===
//             remainingIntervals[remainingIntervals.length - 1].intervalIndex
//           ) {
//             // updatedTarget = +(updatedTarget + remainingSum).toFixed(2); // add leftover
//             updatedTarget = +Math.floor(updatedTarget + remainingSum); // add leftover
//           }
//           return {
//             ...interval,
//             intervalTarget: updatedTarget,
//           };
//         }
//         return interval;
//       });
//       return await this.kpiModel.findByIdAndUpdate(
//         child._id,
//         {
//           targetValue: divideChild,
//           initialTargetValue: divideChild,
//           breakdownData: updatedBreakdownData,
//         },
//         { new: true }
//       );
//     }
//   })
// );

const updatedChildren = await Promise.all(
  childKpiUpdate.map(async (child: any) => {
    if (a._id.toString() === child.parentKpiId.toString()) {
      const now = new Date();

      const remainingIntervals = child.breakdownData.filter(interval => {
        const end = new Date(interval.endDate);
        return now <= end;
      });

      const sumBeforeToday = child.breakdownData
        .filter(interval => new Date(interval.endDate) < now)
        .reduce((sum, interval) => sum + interval.intervalTarget, 0);

      const newTargetValue = divideChild - sumBeforeToday;

      const intervalCount = remainingIntervals.length;
      if (intervalCount === 0) {
        return await this.kpiModel.findByIdAndUpdate(
          child._id,
          {
            targetValue: divideChild,
            initialTargetValue: divideChild,
            breakdownData: child.breakdownData,
          },
          { new: true }
        );
      }

      const effectiveTargetValue = newTargetValue / intervalCount;

      // Base integer value for each
      const baseValue = Math.floor(effectiveTargetValue);

      // Total assigned so far
      let totalAssigned = 0;

      const updatedBreakdownData = child.breakdownData.map(interval => {
        const isRemaining = new Date(interval.endDate) >= now;

        if (!isRemaining) return interval;

        const isLast =
          interval.intervalIndex ===
          remainingIntervals[remainingIntervals.length - 1].intervalIndex;

        if (!isLast) {
          totalAssigned += baseValue;
          return {
            ...interval,
            intervalTarget: baseValue,
          };
        } else {
          // Calculate leftover and add to last interval
          const leftover = Math.round(newTargetValue - totalAssigned);
          return {
            ...interval,
            intervalTarget: leftover,
          };
        }
      });

      return await this.kpiModel.findByIdAndUpdate(
        child._id,
        {
          targetValue: divideChild,
          initialTargetValue: divideChild,
          breakdownData: updatedBreakdownData,
        },
        { new: true }
      );
    }
  })
);


      }
    }

    // Create new team KPIs
    for (const teamId of toCreate) {
      const teamData = updateKpiDto.childKpis.find((c: any) => c.id === teamId);
      const totalTarget = teamData.intervalBreakDown.reduce(
        (sum: any, interval: any) => {
          const intervalTarget = Number(interval.intervalTarget);
          return sum + intervalTarget;
        },
        0,
      );
      if (teamData) {
        const newTeamKpi = {
          name: teamData.kpiName,
          parentKpiId:new Types.ObjectId(companyKpiId),
          parentKpiName: existingKpi.name,
          organizationId: existingKpi.organizationId,
          measurementUnit: existingKpi.measurementUnit,
          currencyType: existingKpi.currencyType,
          targetValue:
            existingKpi.divisionType == 'standalone'
              ? updateKpiDto.targetValue
              : totalTarget,
          currentValue: 0,
          initialTargetValue:totalTarget,
          contribution: teamData.contribution,
          frequency: teamData.frequency,
          ownerId: teamData.ownerId || existingKpi.ownerId, // Fallback to company KPI owner if not specified
          createdBy: existingKpi.createdBy,
          teamId: { id: teamId, name: teamData.name || `Team ${teamId}` },
          quarter: existingKpi.quarter,
          quarterStartDate:existingKpi.quarterStartDate,
          quarterEndDate:existingKpi.quarterEndDate,
          breakdownData: teamData.intervalBreakDown,
          kpiType: 'team',
          divisionType: existingKpi.divisionType,
        };

        await this.kpiModel.create(newTeamKpi);
      }
    }

    // Update company KPI with final team KPIs
    const finalTeamKpis = await this.kpiModel
      .find({ parentKpiId: new Types.ObjectId(companyKpiId) }, '_id name teamId')
      .lean();

    const updatedChildKpis = finalTeamKpis.map((k) => ({
      id: k.teamId?.id,
      name:k.teamId?.name,
      kpiName: k.name || '',
      kpiId:k._id
    }));

    // Filter out removed teamIds from the company KPI's teamIds array
    const updatedTeamIds = existingKpi.teamIds.filter(
      (team: any) => !toDelete.includes(team.id),
    );

    // Add new teamIds to the list if not already present
    for (const teamId of toCreate) {
      const teamData = updateKpiDto.teamIds.find((t: any) => t.id === teamId);
      if (teamData) {
        updatedTeamIds.push({ id: teamId, name: teamData.name });
      }
    }
    // Update the company KPI
    await this.kpiModel.findByIdAndUpdate(companyKpiId, {
      name: updateKpiDto.name,
      childKpis: updatedChildKpis,
      teamIds: updatedTeamIds,
    });

    // await this.kpiModel.findByIdAndUpdate(companyKpiId, {
    //   childKpis: finalTeamKpis.map(k => ({
    //     id: k.teamId,
    //     kpiName: k.name || "",
    //   })),
    // });
  }

  private async updateChildKpis(
    parentKpi: Kpi,
    updateKpiDto: any,
  ): Promise<void> {
    //   // If this is a team KPI and assigneeIds are provided, update the team KPI's assigneeIds array
    //   if (parentKpi.kpiType === 'team' && updateKpiDto.breakdownData) {
    //     parentKpi.assigneeIds = updateKpiDto.assigneeIds;
    //     await parentKpi.save();
    //   }
    //   const childKpis = await this.kpiModel
    //     .find({ parentKpiId: parentKpi._id })
    //     .exec();
    //   if (!parentKpi.breakdownData || !Array.isArray(parentKpi.breakdownData)) {
    //     throw new Error('Parent breakdown data is not an array or is missing');
    //   }
    //   for (const childKpi of childKpis) {
    //     await(async() => {
    //       const childBreakdown = parentKpi.breakdownData.find(
    //         (breakdown) =>
    //           breakdown.id === childKpi.ownerId?.id ||
    //           breakdown.id === childKpi.teamId,
    //       );
    //       if (childBreakdown) {
    //         // Update child KPI's breakdown data
    //         childKpi.breakdownData = [
    //           {
    //             id: childBreakdown.id,
    //             name: childBreakdown.name,
    //             kpiName: childBreakdown.kpiName,
    //             contribution: childBreakdown.contribution,
    //             frequency: childBreakdown.frequency,
    //             kpiId: childKpi._id.toString(),
    //             intervalBreakDown: childBreakdown.intervalBreakDown.map(
    //               (interval) => ({
    //                 ...interval,
    //                 intervalTarget:
    //                   parentKpi.divisionType === 'standalone'
    //                     ? String(Number(parentKpi.targetValue))
    //                     : String(Number(interval.intervalTarget)),
    //               }),
    //             ),
    //           },
    //         ];
    //         // Recalculate metrics for child KPI
    //         const childKpiMetrics = this.calculateKpi(childKpi);
    //         childKpi.quarterlyGoal = Number(childKpiMetrics.quarterlyGoal);
    //         childKpi.qtdGoal = Number(childKpiMetrics.qtdGoal);
    //         childKpi.qtdAchieved = Number(childKpiMetrics.qtdAchieved);
    //         childKpi.weeklyGoal = Number(childKpiMetrics.weeklyGoal);
    //         childKpi.intervalsLeft = childKpiMetrics.intervalsLeft;
    //         childKpi.goalAchieved = Number(childKpiMetrics.goalAchieved);
    //         if (childKpi.kpiType === 'individual') {
    //           childKpi.graphData = {
    //             contribution: this.generateGraphDataContribution(childKpi),
    //             target: this.generateGraphDataTarget(childKpi),
    //           };
    //         }
    //           name: childKpi.name,
    //           type: childKpi.kpiType,
    //           afterUpdate: {
    //             quarterlyGoal: childKpi.quarterlyGoal,
    //             qtdGoal: childKpi.qtdGoal,
    //             weeklyGoal: childKpi.weeklyGoal,
    //             targetValue: childKpi.targetValue,
    //             divisionType: childKpi.divisionType,
    //           },
    //         });
    //         if (childKpi.kpiType === 'team') {
    //           await this.updateChildKpis(childKpi, updateKpiDto);
    //         }
    //       }
    //     })()
    //   }
    //   // Update parent KPI's breakdown data with all child KPIs' data
    //   parentKpi.breakdownData = childKpis.map(kpi => ({
    //     id: kpi.ownerId?.id || kpi.teamId,
    //     name: kpi.ownerId?.name || kpi.name,
    //     kpiName: kpi.name,
    //     contribution: '100.00',
    //     frequency: kpi.frequency,
    //     kpiId: kpi._id.toString(),
    //     intervalBreakDown: kpi.breakdownData || []
    //   }));
    //   parentKpi.markModified('breakdownData');
    //   await parentKpi.save();
  }
  // this for removing kpis

  async remove(id: string): Promise<Kpi> {
    return this.kpiModel.findByIdAndDelete(id).exec();
  }


  async updateIntervalKpi(id: string, updateKpiDto: UpdateIntervalBreakdownDto): Promise<any> {
    const data = updateKpiDto;
    const kpiData = await this.kpiModel.findById(id).exec();

    if (!kpiData) throw new Error('KPI not found');

    if (!Array.isArray(kpiData.breakdownData)) {
      throw new Error('Breakdown data is missing or not an array');
    }

    const { intervalIndex, currentValue, user,isUpdated = true } = data;
    let updated = false;

    // 🔄 Update intervalContribution
    kpiData.breakdownData = kpiData.breakdownData.map((interval) => {
      if (interval.intervalIndex === intervalIndex) {
        interval.intervalContribution = currentValue;
        interval.isUpdated=isUpdated
        updated = true;
        interval.notes = data.notes || "";
      }
      return interval;
    });

    if (!updated) {
      throw new Error(
        `Interval index ${intervalIndex} not found in breakdown data`,
      );
    }

    // 🔢 Compute totalContribution and weeks with target > 0
    let totalContribution = 0;
    let activeWeeksCount = 0;

    // ✅ Handle standalone logic
    if (kpiData.divisionType === 'standalone') {
       kpiData.breakdownData.forEach((interval) => {
      const target = Number(interval.intervalTarget);
      const contrib = Number(interval.intervalContribution);
      const isIntervalUpdated =interval.isUpdated || false
      if (!isNaN(target) && target > 0 && !isNaN(contrib) && isIntervalUpdated ) {
        activeWeeksCount += 1;
        totalContribution += contrib;
      }
    });
      const avg =
        activeWeeksCount > 0 ? totalContribution / activeWeeksCount : 0;
      kpiData.currentValue = avg;
    } else {
      kpiData.breakdownData.forEach((interval) => {
      const target = Number(interval.intervalTarget);
      const contrib = Number(interval.intervalContribution);
      const isIntervalUpdated =interval.isUpdated || false
      if (!isNaN(target) && !isNaN(contrib) && isIntervalUpdated ) {
        totalContribution += contrib;
      }
    });
      // fallback to full sum for other types
      kpiData.currentValue = totalContribution;
    }

    kpiData.markModified('currentValue');
    kpiData.markModified('breakdownData');

    if (user) {
      kpiData.lastUpdatedBy = new Types.ObjectId(user.id)
      kpiData.markModified('lastUpdatedBy');
    }

    // Optionally sync orgId from parent
    if (kpiData.parentKpiId) {
      const parent = await this.kpiModel.findById(new Types.ObjectId(kpiData.parentKpiId)).exec();
      if (parent) {
        kpiData.organizationId = parent.organizationId;
      }
    }

    const savedKpi = await kpiData.save();

    if (kpiData.parentKpiId && kpiData.kpiType === 'individual') {
      const parent = await this.kpiModel.findById(new Types.ObjectId(kpiData.parentKpiId)).exec();
      if (parent && parent.kpiType === 'team') {
        await this.updateParentIntervalKpi(parent);
      }
    }

    return savedKpi;
  }

  private async updateParentIntervalKpi(parentKpi: Kpi): Promise<void> {

    const childKpis = await this.kpiModel
      .find({ parentKpiId: parentKpi._id })
      .exec();

    if (!Array.isArray(parentKpi.breakdownData)) {
      throw new Error('Parent breakdownData is missing or not an array');
    }

    // 1. Update assigneeIds if team KPI
    if (parentKpi.kpiType === 'team') {
      const uniqueAssigneesMap = new Map();

      childKpis
        .filter((child) => child.kpiType === 'individual')
        .forEach((child) => {
          const ownerId = child.ownerId.id;
          if (!uniqueAssigneesMap.has(ownerId)) {
            uniqueAssigneesMap.set(ownerId, {
              id: ownerId,
              name: child.ownerId.name,
            });
          }
        });

      parentKpi.assigneeIds = Array.from(uniqueAssigneesMap.values());
      parentKpi.markModified('assigneeIds');
    }

    const intervalMap = new Map<number, { totalContribution: number; count: number ,isUpdated: boolean}>();


    childKpis.forEach((childKpi) => {
      const breakdown = childKpi.breakdownData || [];

      breakdown.forEach((interval) => {
        const idx = interval.intervalIndex;

       if (!intervalMap.has(idx)) {
        intervalMap.set(idx, {
          totalContribution: 0,
          count: 0,
          isUpdated:false
        });
      }
        const entry = intervalMap.get(idx);
        entry.totalContribution += Number(interval.intervalContribution) || 0;
        entry.count += 1;
        if(interval.isUpdated){
          entry.isUpdated=true
        }
      });
    });

    // 3. Set parent breakdownData based on aggregation type
    parentKpi.breakdownData.forEach((parentInterval) => {
      const aggregated = intervalMap.get(parentInterval.intervalIndex);
      if (aggregated) {
        const isStandalone = parentKpi.divisionType === 'standalone';
        const avgContribution =
        isStandalone && aggregated.count > 0
          ? aggregated.totalContribution / aggregated.count
          : aggregated.totalContribution;

      parentInterval.intervalContribution = avgContribution;

      parentInterval.isUpdated = aggregated.isUpdated;
      }
      },
    );

    parentKpi.markModified('breakdownData');

    // 4. Calculate currentValue as sum of all non-zero contributions
    const currentValue = parentKpi.breakdownData.reduce((sum, i) => {
      const val = Number(i.intervalContribution);
      return val > 0 ? sum + val : sum;
    }, 0);
    parentKpi.currentValue = currentValue

    await parentKpi.save();
  

    // 6. Cascade up to company KPI
    if (parentKpi.kpiType === 'team' && parentKpi.parentKpiId && isValidObjectId(parentKpi.parentKpiId)) {
     
      const companyKpi = await this.kpiModel
        .findById(new Types.ObjectId(parentKpi.parentKpiId))
        .exec();
      if (companyKpi?.kpiType === 'company') {
        await this.updateParentIntervalKpi(companyKpi);
      }
    }
  }

  // Generalized method to find matching parent KPIs (team or company)
  // async findMatchingParentKpis(
  //   childKpi: Kpi,
  //   parentKpiType: 'team' | 'company',
  // ): Promise<Partial<Kpi>[]> {
  //   const projection: any = { name: 1, ownerId: 1, _id: 1, kpiType: 1 };

  //   if (childKpi.divisionType === 'standalone') {
  //     projection.targetValue = 1;
  //   }

  //   const matchConditions: any = {
  //     kpiType: parentKpiType,
  //     frequency: childKpi.frequency,
  //     quarter: childKpi.quarter,
  //     measurementUnit: childKpi.measurementUnit,
  //     divisionType: childKpi.divisionType,
  //     organizationId: childKpi.organizationId,
  //     quarterStartDate:childKpi.quarterStartDate,
  //     quarterEndDate:childKpi.quarterEndDate,
  //     currencyType:childKpi.currencyType
  //   };

  //   if (parentKpiType === 'team') {
  //     const assigneeId = new Types.ObjectId(childKpi.ownerId.id);
  //     matchConditions['assigneeIds.id'] = { $nin: assigneeId };
  //   } else if (parentKpiType === 'company') {
     
  //     matchConditions['teamIds.id'] = { $nin: [childKpi.teamId.id] };
  //   }

  //   const matchingParentKpis = await this.kpiModel
  //     .find(matchConditions)
  //     .select(projection)
  //     .lean()
  //     .exec();

  //   if (childKpi.divisionType === 'standalone') {
  //     return matchingParentKpis.filter(
  //       (parentKpi) =>
  //         Number(parentKpi.targetValue) === Number(childKpi.targetValue),
  //     );
  //   }
  //   return matchingParentKpis;
  // }

   // Generalized method to find matching parent KPIs (team or company)
  async findMatchingParentKpis(
    childKpi: Kpi,
    parentKpiType: 'team' | 'company',
    inputForm?: any

  ): Promise<Partial<Kpi>[]> {
    const projection: any = { name: 1, ownerId: 1, _id: 1, kpiType: 1 };

    if (childKpi.divisionType === 'standalone') {
      projection.targetValue = 1;
    }

    const matchConditions: any = {
      kpiType: parentKpiType,
      frequency: childKpi.frequency,
      quarter: childKpi.quarter,
      measurementUnit: childKpi.measurementUnit,
      divisionType: childKpi.divisionType,
      organizationId: childKpi.organizationId,
      quarterStartDate:childKpi.quarterStartDate,
      quarterEndDate:childKpi.quarterEndDate,
      currencyType:childKpi.currencyType
    };


if (parentKpiType === 'team') {
  const assigneeId = new Types.ObjectId(childKpi.ownerId.id);
  if (inputForm == 'inputForm=true') {
    matchConditions['assigneeIds.id'] = assigneeId;

  } else {
    matchConditions['assigneeIds.id'] = { $nin: [assigneeId] };
  }
} else if (parentKpiType === 'company') {
  const teamId = childKpi.teamId.id;

  if (inputForm === 'inputForm=true') {
    matchConditions['teamIds.id'] = teamId
  } else {
    matchConditions['teamIds.id'] = { $nin: [teamId] };
  }
}
    // console.log(JSON.stringify(matchConditions),'matcing')

    const matchingParentKpis = await this.kpiModel
      .find(matchConditions)
      .select(projection)
      .lean()
      .exec();
      

    if (childKpi.divisionType === 'standalone') {
      return matchingParentKpis.filter(
        (parentKpi) =>
          Number(parentKpi.targetValue) === Number(childKpi.targetValue),
      );
    }
    return matchingParentKpis;
  }

  async linkKpiToParent(
    sourceKpiId: string,
    targetKpiId: string,
    sourceKpiType: 'individual' | 'team' | 'company',
    targetKpiType: 'team' | 'company', // Assuming you're using Express.js
  ): Promise<any> {
    
    const sourceKpi = await this.kpiModel.findById(sourceKpiId);
    const targetKpi = await this.kpiModel.findById(targetKpiId);

    // If either KPI is not found, return a 400 Bad Request status code
    if (!sourceKpi || !targetKpi) {
      throw new HttpException(
        {
          success: false,
          message: 'Invalid KPI IDs provided. One or both KPIs not found.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  
    if (sourceKpi.kpiType !== sourceKpiType) {
      throw new HttpException(
        {
          success: false,
          message: `Source KPI must be a ${sourceKpiType} KPI.`,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (targetKpi.kpiType !== targetKpiType) {
      throw new HttpException(
        {
          success: false,
          message: `Target KPI must be a ${targetKpiType} KPI.`,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      sourceKpi.frequency !== targetKpi.frequency ||
      sourceKpi.quarter !== targetKpi.quarter ||
      sourceKpi.measurementUnit !== targetKpi.measurementUnit ||
      sourceKpi.divisionType !== targetKpi.divisionType
    ) {
      throw new HttpException(
        {
          success: false,
          message:
            'KPIs must have matching frequency, quarter, measurement unit, and division type.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (targetKpi.kpiType === 'team') {
      const sourceOwnerId =
        sourceKpi.ownerId?.id || sourceKpi.ownerId?.toString();
      const ownerAlreadyLinked = targetKpi.assigneeIds.some(
        (assignee) => assignee.id === sourceOwnerId,
      );
      if (ownerAlreadyLinked) {
        throw new HttpException(
          {
            success: false,
            message: 'This owner already has a KPI linked to the target KPI.',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    if (targetKpi.kpiType === 'company') {
      const sourceTeamId = sourceKpi.teamId.id;
      const teamAlreadyLinked = targetKpi.teamIds.some(
        (teamId) => teamId.id === sourceTeamId,
      );

      if (!teamAlreadyLinked){
        targetKpi.teamIds.push({
          id: sourceKpi.teamId.id,
          name: sourceKpi.teamId.name,
        });
      }else {
        throw new HttpException(
          {
            success: false,
            message: 'This team already has a KPI linked to the target KPI.',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    // Proceed with the rest of the logic if all checks pass
    sourceKpi.parentKpiId =new Types.ObjectId(targetKpi._id.toString());
    sourceKpi.parentKpiName = targetKpi.name;

    if (targetKpi.divisionType === 'standalone') {
      sourceKpi.targetValue = targetKpi.targetValue;
    }

    if (!Array.isArray(targetKpi.childKpis)) {
      targetKpi.childKpis = [];
    }

    const childKpiExists = targetKpi.childKpis.some(
      (child) => child.id === sourceKpi._id.toString(),
    );

    if (!childKpiExists) {
        targetKpi.childKpis.push({
          id: sourceKpi.kpiType === 'individual' 
            ? sourceKpi.ownerId.id    // assignee ID for individual
            : sourceKpi.teamId.id,     // team ID for team KPI
          kpiId:new Types.ObjectId(sourceKpi._id.toString()),  // always include KPI ID
          name: sourceKpi.kpiType === 'individual'
            ? sourceKpi.ownerId.name
            : sourceKpi.teamId.name,
          kpiName: sourceKpi.name
      });
    }

    // If team KPI, add the owner/assignee
    if (targetKpi.kpiType === 'team') {
      const assigneeExists = targetKpi.assigneeIds?.some(
        (assignee) => assignee.id === sourceKpi.ownerId.id,
      );

      if (!assigneeExists) {
        targetKpi.assigneeIds?.push({
          id: sourceKpi.ownerId.id,
          name: sourceKpi.ownerId.name,
        });
      }
    }

    // Handle breakdown data linkage (same logic as before)
    if (
      Array.isArray(sourceKpi.breakdownData) &&
      Array.isArray(targetKpi.breakdownData)
    ) {
      for (let index = 0; index < sourceKpi.breakdownData.length; index++) {
        const interval = sourceKpi.breakdownData[index];
        const parentInterval = targetKpi.breakdownData.find(
          (bd) => bd.intervalIndex === index,
        );

        if (!parentInterval) {
          console.warn(`No parentInterval found for index: ${index}`);
          continue;
        }

        if (targetKpi.divisionType === 'standalone') {
          let totalContribution = 0;
          // let totalTarget = 0;

          for (const child of targetKpi.childKpis) {
            const childData = await this.kpiModel.findById(child.kpiId);
            const childInterval = childData?.breakdownData?.find(
              (i) => i.intervalIndex === index,
            );
            if (childInterval) {
              totalContribution += Number(
                childInterval.intervalContribution || 0,
              );
              // totalTarget += Number(childInterval.intervalTarget || 0);
            }
          }

          const numChildren = targetKpi.childKpis.length || 1;
         const StandAloneContributions= Number(
            totalContribution / numChildren,
          );
           parentInterval.intervalContribution =StandAloneContributions
          parentInterval.intervalTarget = targetKpi.targetValue;
        } else if (targetKpi.divisionType === 'cumulative') {
          parentInterval.intervalContribution = Number(
            Number(parentInterval.intervalContribution || 0) +
              Number(interval.intervalContribution || 0),
          );
          parentInterval.intervalTarget = Number(
            Number(parentInterval.intervalTarget || 0) +
              Number(interval.intervalTarget || 0),
          );
        }
      }

      if (targetKpi.divisionType === 'cumulative') {
        targetKpi.targetValue = Number(
          Number(targetKpi.targetValue || 0) + Number(sourceKpi.targetValue || 0)
        );
        targetKpi.currentValue = Number(
          Number(targetKpi.currentValue || 0) + Number(sourceKpi.currentValue || 0)
        );
        targetKpi.initialTargetValue = Number(
          Number(targetKpi.initialTargetValue || 0) + Number(sourceKpi.initialTargetValue || 0)
        );
        targetKpi.initialCurrentValue = Number(
          Number(targetKpi.initialCurrentValue || 0) + Number(sourceKpi.initialCurrentValue || 0)
        );
      
        for (const child of targetKpi.childKpis) {
          const childData = await this.kpiModel.findById(child?.kpiId);
      
          if (!childData) continue;
      
          const childTargetValue = childData?.targetValue || 0;
          const parentTargetValue = targetKpi?.targetValue || 0;
      
          let childContribution: number = 0;
          if (parentTargetValue !== 0) {
            childContribution = (childTargetValue / parentTargetValue) * 100;
          }
          childData.contribution = String(childContribution);
      
          // Explicitly save the updated childData to persist changes
          await childData.save();
        }
      
        // Mark targetKpi breakdownData as modified before saving
        targetKpi.markModified('breakdownData');
      }
  }

    await targetKpi.save();
    await sourceKpi.save();

    const successResponse = {
      success: true,
      message: 'KPI linked successfully.',
      data: { sourceKpi, targetKpi },
    };
     return successResponse;
  }
}
