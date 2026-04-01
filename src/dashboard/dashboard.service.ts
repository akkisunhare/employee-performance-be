import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Kpi } from 'src/kpi/entities/kpi.entity';
import { Priority, PriorityDocument } from 'src/priorities/entity/priority.schema';
import { Quarter, QuarterDocument } from 'src/quarter/entities/quarter.schema';
import { Team } from 'src/teams/entities/team.entity';
import { myDashboardTeamDto } from './dto/my-dashboard.dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Team.name) private teamModel: Model<Team>,
    @InjectModel(Kpi.name) private kpiModel: Model<Kpi>,
    @InjectModel(Quarter.name) private QuatersModule: Model<QuarterDocument>,
    @InjectModel(Priority.name) private priorityModel: Model<PriorityDocument>,
  ) {}
  async getDashbordTeam(teamId: string): Promise<any> {
    try {
      const totals = {
        quarterlyGoal: 0,
        qtdGoal: 0,
        qtdAchieved: 0,
        weeklyGoal: 0,
        goalAchieved: 0,
        currentWeekAchieved: 0,
      };
      const breakdownTotals: {
        intervalIndex: number;
        intervalName: string;
        intervalContribution: number;
        intervalTarget: number;
      }[] = [];
      const teams = await this.teamModel
        .find({ _id: teamId })
        .populate('memberIds', 'name')
        .populate('createdBy', 'name')
        .populate('lastUpdatedBy', 'name')
        .exec();
  

      const kpi = await this.kpiModel.find({ 'teamId.id': teamId });
      for (let i = 0; i < kpi.length - 1; i++) {
        const value = await this.calculateKpi(kpi[i]);
        for (const key in totals) {
          totals[key] += value[key];
        }

        for (const interval of kpi[i].breakdownData ?? []) {
          const idx = interval.intervalIndex;
          if (!breakdownTotals[idx]) {
            breakdownTotals[idx] = {
              intervalIndex: interval.intervalIndex,
              intervalName: interval.intervalName,
              intervalContribution: 0,
              intervalTarget: 0,
            };
          }

          breakdownTotals[idx].intervalContribution +=
            interval.intervalContribution;
          breakdownTotals[idx].intervalTarget += interval.intervalTarget;
        }
      }

      //pecentage
      const qtdAchieved = totals.qtdGoal > 0 ? (totals.qtdAchieved / totals.qtdGoal) * 100 : 0;
      const quarterlyGoal =totals.quarterlyGoal > 0 ? (totals.goalAchieved / totals.quarterlyGoal) * 100 : 0;
      const weeklyGoal  =  totals.weeklyGoal > 0 ? (totals.currentWeekAchieved / totals.weeklyGoal) * 100 : 0;
      const goalAchieved = totals.goalAchieved > 0 ? (totals.goalAchieved / totals.goalAchieved) * 100 : 0;
      return {
        success: true,
        message: 'Teams retrieved successfully',
        data: { teams, totals, length: kpi.length, breakdownTotals, meter:{qtdAchieved, quarterlyGoal, weeklyGoal, goalAchieved}},
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
  async calculateKpi(data) {
    const type = data?.divisionType;
    const quarter = data.quarter; // "q1-2025"
    const breakdownData = data.breakdownData;
    let targetValue = data.targetValue;

    const now = new Date(); // March 25, 2025
    const [qtr, year] = quarter.split('-');
    const quarterStartMonth = { q1: 0, q2: 3, q3: 6, q4: 9 }[qtr];
    const organizationId = data.organizationId;
    // const foundQuarter:any = await this.QuatersModule.find({year:year,organizationId:organizationId,quarter:qtr}).exec();

    const foundQuarter: any = await this.QuatersModule.find({
      year: year,
      organizationId: organizationId,
      quarter: qtr,
    });

    let quarterStart: Date;

    if (foundQuarter && foundQuarter.length > 0) {
      quarterStart = new Date(foundQuarter[0].start_date);
    } else {
      quarterStart = new Date(parseInt(year), quarterStartMonth, 1);
    }
    const daysSinceQuarterStart = Math.floor(
      (now.getTime() - quarterStart.getTime()) / (1000 * 60 * 60 * 24),
    );
    const currentWeekIndex = Math.floor(daysSinceQuarterStart / 7);

    const intervalsLeft = await this.getIntervalsLeft(data);

    let quarterlyGoal = 0,
      qtdGoal = 0,
      goalAchieved = 0,
      qtdAchieved = 0,
      weeklyGoal = 0,
      currentWeekAchieved = 0;

    if (type === 'cumulative') {
      // For cumulative KPIs, quarterly goal is always the target value
      quarterlyGoal = Number(targetValue);

      // Use full breakdownData array and map through all intervals
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
    } else if (type === 'standalone') {
      // Calculate weeks with both target and contribution > 0
      const weeksWithNonZeroValues = breakdownData.filter((interval) => {
        const target = parseFloat(interval.intervalTarget);
        const contribution = parseFloat(interval.intervalContribution);
        return target > 0 && contribution > 0;
      }).length;

      // Calculate cumulative targets and contributions up to current week
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

      // Weekly goals (current week)
      weeklyGoal = Number(breakdownData[currentWeekIndex]?.intervalTarget || 0);

      // Get the current week's contribution directly
      const currentWeekContribution =
        breakdownData[currentWeekIndex]?.intervalContribution;
      currentWeekAchieved = Number(parseFloat(currentWeekContribution) || 0);

      const Achieved = Number(currentSum / weeksWithNonZeroValues);
      // QTD calculations
      qtdGoal = targetValue; // Use cumulative target sum instead of fixed value
      qtdAchieved = isNaN(Achieved) ? 0 : Achieved; // Direct cumulative sum, not divided by weeks

      if (data.kpiType === 'company') {
        if (data.divisionType === 'standalone') {
          // For standalone company KPIs, use the target value directly
          quarterlyGoal = Number(targetValue);
          qtdGoal = Number(targetValue);
          weeklyGoal = Number(targetValue);
          qtdAchieved = qtdAchieved;
        } else {
          // For cumulative company KPIs, apply the ratio
          let ratio = quarterlyGoal / targetValue;
          quarterlyGoal = quarterlyGoal / ratio;
          qtdGoal = qtdGoal / ratio;
          weeklyGoal = weeklyGoal / ratio;
          qtdAchieved = qtdAchieved / ratio;
        }
      }
    }

    return {
      quarterlyGoal,
      qtdGoal,
      qtdAchieved,
      weeklyGoal,
      goalAchieved,
      currentWeekAchieved,
      intervalsLeft: `${intervalsLeft}`,
    };
  }
  async getIntervalsLeft(data: any) {
    const [qtr, year] = data.quarter.split('-');
    const foundQuarter: any = await this.QuatersModule.find({
      year: year,
      organizationId: data?.organizationId,
      quarter: qtr,
    });

    // Define quarter start months
    const quarterStartMonth = { q1: 0, q2: 3, q3: 6, q4: 9 }[qtr];

    let quarterEnd;
    const now = new Date();

    if (foundQuarter && foundQuarter.length > 0) {
      // Use the correct end date from the quarter
      quarterEnd = new Date(foundQuarter[0].end_date); // This should be the end_date
    } else {
      // Default logic: Calculate the quarter's end date using the start month + 3 months
      quarterEnd = new Date(parseInt(year), quarterStartMonth + 3, 0); // Last day of the quarter
    }
    // Calculate days left until the quarter ends
    const daysLeft = Math.max(
      0,
      Math.ceil((quarterEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)), // Convert ms to days
    );
    const left = `${Math.ceil(daysLeft / 7)} weeks left`;
    // Return weeks left
    return left;
  }
  async getMyDashbordData(req: any, data: any) {
    try {
      let dashboardData = [];
      if (data.dataType == 'kpi') {
        dashboardData = await this.kpiModel.find({
          'ownerId.id': req.sub,
        })
      } else {
        dashboardData = await this.priorityModel.find({
          'owner': new Types.ObjectId(req.sub),
        })
      }
      return {
        success: true,
        // statusCode: 200,
        message: 'Data retrieved successfully',
        data: dashboardData,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Data not found.',
          data: null,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  
  async getDashboardTeamData(req: any, data: myDashboardTeamDto) {
    try {
      const { memberId, type } = data;
      const { organizationId } = req;

      // Fetch priorities where the user is the owner
      const prioTeamData = await this.priorityModel.find({
        owner: new Types.ObjectId(memberId),
        organizationId,
      });

      // Fetch KPIs where the user is an assignee
      const kpiTeamData = await this.kpiModel.find({
        'assigneeIds.id': memberId,
        organizationId,
        kpiType: type,
      });

      // Collect child KPI IDs if kpiType is 'team'
      const teamMemberKpiIds: any[] = [];
      for (const kpi of kpiTeamData) {
        if (kpi.kpiType === 'team' && Array.isArray(kpi.childKpis)) {
          kpi.childKpis.forEach((child: any) => {
            if (child?.kpiId) {
              teamMemberKpiIds.push(child.kpiId.toString());
            }
          });
        }
      }
      const groupKpi = await this.kpiModel.find({
        '_id': {$in: teamMemberKpiIds.map(id => new Types.ObjectId(id))}
      })
      return {
        success: true,
        message: 'Data retrieved successfully',
        data: {
          kpiData: kpiTeamData,
          prioData: prioTeamData,
          teamKpi: groupKpi,
        },
      };
    } catch (error) {
      console.error("Error in getDashboardTeamData:", error);
      throw new HttpException(
        {
          success: false,
          message: 'Data not found.',
          data: null,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
