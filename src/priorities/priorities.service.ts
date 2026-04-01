import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PriorityHistory, PriorityHistoryDocument } from './priority-history.schema';
import { CreatePriorityDto } from './dto/create-priority.dto';
import { Team } from '../teams/entities/team.entity';
import { User } from 'src/users/entities/user.entity';
import { Priority, PriorityDocument } from './entity/priority.schema';
import { PriorityStatus, WeekStatusData } from './dto/priority.types';
import { UpdateWeekStatusDto } from './dto/update-week-status.dto';
import { PrioDto } from './dto/get-all-priorities.dto';
import { PermissionsService } from 'src/permissions/permissions.service';
import { Permission } from 'src/permissions/permissions.enum';
import { EmailService } from 'src/mail-send/mail.service';

@Injectable()
export class PrioritiesService {
  constructor(
    @InjectModel(Priority.name) private priorityModel: Model<PriorityDocument>,
    @InjectModel(PriorityHistory.name) private priorityHistoryModel: Model<PriorityHistoryDocument>,
    @InjectModel(Team.name) private teamModel: Model<Team>,
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly permissionsService: PermissionsService,
    private readonly emailService: EmailService
  ) {}

  async create(createPriorityDto: CreatePriorityDto, user: { sub: string; organizationId: string; role: string, name:string }): Promise<Priority> {
    if (createPriorityDto.team) {
      const team = await this.teamModel.findById(createPriorityDto.team).exec();
      if (team) {
        createPriorityDto['teamOwnerId'] = team.owner.id;
      }
    }

    const weekStatusdata: WeekStatusData[] = [];
    const startWeekIndex = createPriorityDto.startWeek.intervalIndex;
  const endWeekIndex = createPriorityDto.endWeek.intervalIndex;


   const weekCount = endWeekIndex - startWeekIndex + 1;

    for (let i = 0; i < weekCount; i++) {
    const currentWeekIndex = startWeekIndex + i;
    const currentDate = new Date(createPriorityDto.startWeek.startDate);
    currentDate.setDate(currentDate.getDate() + (i * 7));
    
    const weekStartDate = new Date(currentDate);
    const weekEndDate = new Date(currentDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6);
    
    const now = new Date();
    let status: PriorityStatus = 'Not yet started';
    
    if (now >= weekStartDate && now <= weekEndDate) {
      status = 'Not yet started'; // Current week
    } else if (now < weekStartDate) {
      status = 'Not applicable'; // Future week
    } else {
      status = 'Not yet started'; // Past week (you might want to change this)
    }
    
    weekStatusdata.push({
      intervalIndex: currentWeekIndex,
      intervalName: `Week ${currentWeekIndex + 1}`, // Assuming intervalIndex starts from 0
      startDate: weekStartDate,
      endDate: weekEndDate,
      status: status,
      description: '',
    });
  }
  
      const createdPriority = new this.priorityModel({
    ...createPriorityDto,
    createdBy: new Types.ObjectId(user.sub),
    owner: new Types.ObjectId(createPriorityDto.owner),
    organizationId: user.organizationId,
    team: createPriorityDto.team ? new Types.ObjectId(createPriorityDto.team) : undefined,
    weekStatusdata: weekStatusdata,
    status: 'Not yet started', 
    isDeleted: false, 
  });
  if(createdPriority){
 const historyRecords={
          priorityId: createdPriority._id.toString(),
          field:'Created Priority',
          previousValue: createPriorityDto.name,
          updatedValue: createPriorityDto.name,
          updatedBy:{
        id: user?.sub || 'system',
        name: user?.name || 'system'
      }
        };
     await this.priorityHistoryModel.insertOne(historyRecords);
  }
    return createdPriority.save();
  }

  async findAll(user: any): Promise<Priority[]> {
    const results = await this.priorityModel
      .find({ organizationId: user.organizationId })
      .populate('owner', 'name')
      .populate('team', 'name')
      .exec();
      // console.log(results);
    return results;
  }

  async findByType(type: string, user: any): Promise<Priority[]> {
    const query: any = {
      organizationId: user.organizationId
    };

    // Get user's team memberships
    const userTeams = await this.teamModel.find({
      organizationId: user.organizationId,
      memberIds: user.sub
    }).exec();
    
    const teamIds = userTeams.map(team => team._id.toString());

    if (type === 'individual') {
      
      const isAdminOrOwner = user.role === 'admin' || user.role === 'organization_owner';
      
      if (isAdminOrOwner) {
        query.$or = [
          { type: 'individual' },
          { team: { $in: teamIds }, type: 'team' }
        ];
      } else {
        query.$or = [
          { owner: user.sub, type: 'individual' },
          { createdBy: user.sub, type: 'individual' },
          { team: { $in: teamIds }, type: 'team' }
        ];
      }
    } else if (type === 'team') {
      // For team priorities, show team priorities and company priorities
      query.$or = [
        { type: 'team', team: { $in: teamIds } },
        { type: 'company' }
      ];
    } else if (type === 'company') {
      // For company priorities
      query.type = 'company';
    }

    return this.priorityModel.find(query) .populate('owner', 'name')
  .populate('team', 'name').populate('createdBy','name').exec();
  }

  // async findByTypePost(
  //   body: PrioDto,
  //   user: any
  // ): Promise<{ data: Priority[]; pagination: any }> {
  //   try {
  //     const {
  //       prioType,
  //       page = 1,
  //       limit = 10,
  //       filters = {},
  //       sortBy,
  //       search = "",
  //     } = body;

  //     const { organizationId: orgId, sub: userId } = user;
  //     const query: any = { organizationId: orgId };

  //     if (prioType) query.type = prioType;

  //     // If no specific quarter is passed, filter by current date within quarter range
  //     if (!filters.quarter) {
  //       const now = new Date();
  //       query.quarterStartDate = { $lte: now };
  //       query.quarterEndDate = { $gte: now };
  //     }

  //     // Handle text search
  //     if (search.trim() !== "") {
  //       query.$text = { $search: search.trim() };
  //     }

  //     for (const [field, value] of Object.entries(filters)) {
  //       if (
  //         value === undefined ||
  //         value === null ||
  //         value === "" ||
  //         (Array.isArray(value) && value.length === 0)
  //       ) {
  //         continue;
  //       }
  //       let dbField = field;
  //       if (field === "ownerId") dbField = "owner";

  //       if (Array.isArray(value)) {
  //         if (["owner", "createdBy", "team"].includes(dbField)) {
  //           query[dbField] = {
  //             $in: value.map((id: string) => new Types.ObjectId(id)),
  //           };
  //         } else {
  //           query[dbField] = { $in: value };
  //         }
  //       } else {
  //         if (["owner", "createdBy", "team"].includes(dbField)) {
  //           query[dbField] = new Types.ObjectId(value);
  //         } else {
  //           query[dbField] = value;
  //         }
  //       }
  //     }

  //     // Sorting
  //     const sortQuery: any = sortBy?.field
  //       ? { [sortBy.field]: sortBy.order === "asc" ? 1 : -1 }
  //       : { updatedAt: -1 };

  //     // Permissions check
  //     const [canViewAll, canViewTeam, canViewIndividual] = await Promise.all([
  //       this.permissionsService.hasAnyPermission(userId, orgId, [
  //         Permission.VIEW_ALL_PRIORITY,
  //       ]),
  //       this.permissionsService.hasAnyPermission(userId, orgId, [
  //         Permission.VIEW_TEAM_PRIORITY,
  //       ]),
  //       this.permissionsService.hasAnyPermission(userId, orgId, [
  //         Permission.VIEW_INDIVIDUAL_PRIORITY,
  //       ]),
  //     ]);

  //     if (!canViewAll) {
  //       const orConditions: any[] = [];
  //       if (canViewTeam) {
  //         orConditions.push(
  //           { owner: new Types.ObjectId(userId) },
  //           { createdBy: new Types.ObjectId(userId) }
  //         );
  //       }
  //       if (canViewIndividual) {
  //         orConditions.push(
  //           { owner: new Types.ObjectId(userId) },
  //           { createdBy: new Types.ObjectId(userId) }
  //         );
  //       }
  //       const uniqueOrConditions = orConditions.filter(
  //         (condition, index, self) =>
  //           index ===
  //           self.findIndex(
  //             (c) => JSON.stringify(c) === JSON.stringify(condition)
  //           )
  //       );
  //       if (uniqueOrConditions.length > 0) {
  //         query.$or = uniqueOrConditions;
  //       } else {
  //         return {
  //           data: [],
  //           pagination: {
  //             currentPage: 0,
  //             pageSize: limit,
  //             totalPages: 0,
  //             totalRecords: 0,
  //           },
  //         };
  //       }
  //     }
  //     const skip = (page - 1) * limit;
  //     let data: Priority[] = [];
  //     let totalItems = 0;

  //     // Special case for sorting by owner.name
  //     if (sortBy?.field === "owner") {
  //       const fullData = await this.priorityModel
  //         .find(query)
  //         .populate("owner", "name")
  //         .populate("team", "name")
  //         .populate("createdBy", "name")
  //         .populate("lastUpdatedBy", "name")
  //         .populate("weekStatusdata.lastUpdatedBy", "name");

  //       fullData.sort((a: any, b: any) => {
  //         const nameA = a.owner?.name?.toLowerCase() || "";
  //         const nameB = b.owner?.name?.toLowerCase() || "";
  //         return sortBy.order === "desc"
  //           ? nameA.localeCompare(nameB)
  //           : nameB.localeCompare(nameA);
  //       });

  //       totalItems = fullData.length;
  //       data = fullData.slice(skip, skip + limit);
  //     } else {
  //       [data, totalItems] = await Promise.all([
  //         this.priorityModel
  //           .find(query)
  //           .populate("owner", "name")
  //           .populate("team", "name")
  //           .populate("createdBy", "name")
  //           .populate("lastUpdatedBy", "name")
  //           .populate("weekStatusdata.lastUpdatedBy", "name")
  //           .sort(sortQuery)
  //           .skip(skip)
  //           .limit(limit),
  //         this.priorityModel.countDocuments(query),
  //       ]);
  //     }
  //     return {
  //       data,
  //       pagination: {
  //         currentPage: Number(page),
  //         pageSize: Number(limit),
  //         totalPages: Math.ceil(totalItems / limit),
  //         totalRecords: totalItems,
  //       },
  //     };
  //   } catch (error) {
  //     console.error("Error in findByTypePost:", error);
  //     throw new InternalServerErrorException("Failed to fetch priorities");
  //   }
  // }

  async findByTypePost(
  body: PrioDto,
  user: any
): Promise<{ data: Priority[]; pagination: any }> {
  try {
    const {
      prioType,
      page = 1,
      limit = 10,
      filters = {},
      sortBy,
      search = "",
    } = body;

    const { organizationId: orgId, sub: userId } = user;
    const query: any = { organizationId: orgId };

    if (prioType) query.type = prioType;

    if (!filters.quarter) {
      const now = new Date();
      query.quarterStartDate = { $lte: now };
      query.quarterEndDate = { $gte: now };
    }

    if (search.trim() !== "") {
      query.$text = { $search: search.trim() };
    }

    for (const [field, value] of Object.entries(filters)) {
      if (
        value === undefined ||
        value === null ||
        value === "" ||
        (Array.isArray(value) && value.length === 0)
      ) {
        continue;
      }

      let dbField = field;
      if (field === "ownerId") dbField = "owner";

      if (Array.isArray(value)) {
        if (["owner", "createdBy", "team"].includes(dbField)) {
          query[dbField] = {
            $in: value.map((id: string) => new Types.ObjectId(id)),
          };
        } else {
          query[dbField] = { $in: value };
        }
      } else {
        if (["owner", "createdBy", "team"].includes(dbField)) {
          query[dbField] = new Types.ObjectId(value);
        } else {
          query[dbField] = value;
        }
      }
    }

    // const [canViewAll, canViewTeam, canViewIndividual] = await Promise.all([
    //   this.permissionsService.hasAnyPermission(userId, orgId, [
    //     Permission.VIEW_ALL_PRIORITY,
    //   ]),
    //   this.permissionsService.hasAnyPermission(userId, orgId, [
    //     Permission.VIEW_TEAM_PRIORITY,
    //   ]),
    //   this.permissionsService.hasAnyPermission(userId, orgId, [
    //     Permission.VIEW_INDIVIDUAL_PRIORITY,
    //   ]),
    // ]);

    // if (!canViewAll) {
    //   const orConditions: any[] = [];
    //   if (canViewTeam) {
    //     orConditions.push(
    //       { owner: new Types.ObjectId(userId) },
    //       { createdBy: new Types.ObjectId(userId) }
    //     );
    //   }
    //   if (canViewIndividual) {
    //     orConditions.push(
    //       { owner: new Types.ObjectId(userId) },
    //       { createdBy: new Types.ObjectId(userId) }
    //     );
    //   }

    //   const uniqueOrConditions = orConditions.filter(
    //     (condition, index, self) =>
    //       index ===
    //       self.findIndex(
    //         (c) => JSON.stringify(c) === JSON.stringify(condition)
    //       )
    //   );

    //   if (uniqueOrConditions.length > 0) {
    //     query.$or = uniqueOrConditions;
    //   } else {
    //     return {
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

    // 🧠 Grouping Logic like KPI method
    const allPriorities = await this.priorityModel
      .find(query)
      .populate("owner", "name")
      .populate("team", "name")
      .populate("createdBy", "name")
      .populate("lastUpdatedBy", "name")
      .populate("weekStatusdata.lastUpdatedBy", "name")
      .lean();

    const groupedMap = new Map<string, Priority[]>();

    for (const item of allPriorities) {
      // const ownerName = item.owner?.name?.toLowerCase() || "zzz";
      const ownerName =
  typeof item.owner === "object" && "name" in item.owner
    ? (item.owner.name as string).toLowerCase()
    : "zzz";

      if (!groupedMap.has(ownerName)) {
        groupedMap.set(ownerName, []);
      }
      groupedMap.get(ownerName)!.push(item);
    }

    // const groupedList: Priority[] = Array.from(groupedMap.entries())
    //   .sort(([a], [b]) => a.localeCompare(b)) // alphabetical by owner name
    //   .flatMap(([, group]) => group);
    const groupedList: Priority[] = Array.from(groupedMap.entries())
  .sort(([a], [b]) => a.localeCompare(b)) // alphabetical by owner name
  .flatMap(([, group]) =>
    group.sort(
  (a, b) =>
    new Date((b as any).createdAt).getTime() -
    new Date((a as any).createdAt).getTime()
)
  );


    const totalItems = groupedList.length;
    const skip = (page - 1) * limit;
    const paginatedData = groupedList.slice(skip, skip + limit);

    return {
      data: paginatedData,
      pagination: {
        currentPage: Number(page),
        pageSize: Number(limit),
        totalPages: Math.ceil(totalItems / limit),
        totalRecords: totalItems,
      },
    };
  } catch (error) {
    console.error("Error in findByTypePost:", error);
    throw new InternalServerErrorException("Failed to fetch priorities");
  }
}


  async findOne(id: string): Promise<Priority> {
    const priority = await this.priorityModel.findById(id).populate('owner', 'name')
  .populate('team', 'name').populate('createdBy','name').populate('lastUpdatedBy','name')
  .populate('weekStatusdata.lastUpdatedBy','name').exec();
    if (!priority) {
      throw new Error('Priority not found');
    }
    return priority;
  }

  async updatePriorityDetails(id: string, updatePriorityDto: any, user?: any): Promise<Priority> {

    const existingPriority = await this.priorityModel.findById(id).exec();
    if (!existingPriority) {
      throw new Error('Priority not found');
    }
    // Ensure owner and team are ObjectId if provided
    if (updatePriorityDto.owner && typeof updatePriorityDto.owner === 'string') {
      updatePriorityDto.owner = new Types.ObjectId(updatePriorityDto.owner);
    }
    if (updatePriorityDto.team && typeof updatePriorityDto.team === 'string') {
      updatePriorityDto.team = new Types.ObjectId(updatePriorityDto.team);
    }

     if (user?.userId) {
      updatePriorityDto.lastUpdatedBy = new Types.ObjectId(user.userId)
    }
    // ====== WEEK STATUS AUTO-EXPAND LOGIC ======
    if (updatePriorityDto.startWeek && updatePriorityDto.endWeek) {
     
       const startWeek = updatePriorityDto.startWeek || existingPriority.startWeek;
        const endWeek = updatePriorityDto.endWeek || existingPriority.endWeek;

        if (startWeek?.intervalIndex===undefined || !endWeek?.intervalIndex===undefined) {
            throw new Error('Invalid week format - must include intervalIndex');
        }
           const existingWeekStatus = existingPriority.weekStatusdata || [];
              // Filter out weeks that are no longer in the selected range
        const filteredWeekStatus = existingWeekStatus.filter((entry: any) => {
            return entry.intervalIndex >= startWeek.intervalIndex && 
                   entry.intervalIndex <= endWeek.intervalIndex;
        });
            
   
    const existingWeeks = new Set(
            filteredWeekStatus.map((entry: any) => entry.intervalIndex)
        );

     
      const newWeekStatus = [...filteredWeekStatus];
   
      for (let i = startWeek.intervalIndex; i <= endWeek.intervalIndex; i++) {
        if (!existingWeeks.has(i)) {
          const weekStartDate = new Date(startWeek.startDate);
          weekStartDate.setDate(weekStartDate.getDate() + (i - startWeek.intervalIndex) * 7);
          const weekEndDate = new Date(weekStartDate);
          weekEndDate.setDate(weekEndDate.getDate() + 6);
          newWeekStatus.push({
           intervalIndex: i,
            intervalName: `week ${i+1}`,
            startDate: weekStartDate,
            endDate: weekEndDate,
            status: 'Not applicable',
            description: '',
            lastUpdatedBy:  new Types.ObjectId(user.userId) || undefined,
            lastUpdatedAt: new Date()
          });
        }
      }
   
      // Sort weekStatusdata by week number
       newWeekStatus.sort((a: any, b: any) => a.intervalIndex - b.intervalIndex);

      updatePriorityDto.weekStatusdata = newWeekStatus;

        // Ensure endWeek is updated if startWeek changed
        if (updatePriorityDto.startWeek && !updatePriorityDto.endWeek) {
            updatePriorityDto.endWeek = {
                ...existingPriority.endWeek,
                intervalIndex: updatePriorityDto.startWeek.intervalIndex,
                intervalName: `Week ${updatePriorityDto.startWeek.intervalIndex}`,
                startDate: updatePriorityDto.startWeek.startDate,
                endDate: updatePriorityDto.startWeek.endDate
            };
        }
    }
   
    // ====== WEEKLY STATUS UPDATE (status timeline) ======
    if (updatePriorityDto.weeklyStatus && updatePriorityDto.weeklyStatus.length > 0) {
      const newWeeklyStatus = updatePriorityDto.weeklyStatus[updatePriorityDto.weeklyStatus.length - 1];

      const existingWeeklyStatus = existingPriority.weeklyStatus || [];
      updatePriorityDto.weeklyStatus = [...existingWeeklyStatus, newWeeklyStatus];

      if (newWeeklyStatus.updateStatus) {
            updatePriorityDto.status = newWeeklyStatus.updateStatus;
        }

     // Update weekStatusdata status for corresponding week
        if (newWeeklyStatus.updateStartWeek) {
            const updatedWeekStatusdata = (existingPriority.weekStatusdata || []).map((entry: any) => {
                if (entry.intervalIndex === newWeeklyStatus.updateStartWeek) {
                    return {
                        ...entry,
                        status: newWeeklyStatus.updateStatus || entry.status,
                        lastUpdatedBy:  new Types.ObjectId(user.userId) || entry.lastUpdatedBy,
                        lastUpdatedAt: new Date()
                    };
                }
                return entry;
            });
            updatePriorityDto.weekStatusdata = updatedWeekStatusdata;
        }
    }
    
   const excludedFields = ['ownerRole', 'teamOwnerId', 'priorityCreateRole', '_id', '__v', 'userId'];
    // ====== HISTORY TRACKING ======
    const historyRecords = [];
    for (const [field, newValue] of Object.entries(updatePriorityDto)) {

       if (excludedFields.includes(field)) continue;

      const updatedBy = {
        id: user?.userId || 'system',
        name: user?.name || 'system'
      };
        // Helper function to convert values to string for history
        const valueToString = (interval: any): string => {
                  function formatDateRange(startISO: string, endISO: string): string {
          const start = new Date(startISO);
          const end = new Date(endISO);

          const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
          const startStr = start.toLocaleDateString(undefined, options);
          const endStr = end.toLocaleDateString(undefined, options);

          return `${startStr} - ${endStr}`;
        }
            const displayLabel = `${interval.intervalName} (${formatDateRange(
                    interval.startDate,
                    interval.endDate
                  )})`;

              return displayLabel
        };
      
        // Special handling for createdBy changes
      if (field === 'createdBy'|| field==='lastUpdatedBy') {

        const userId = typeof newValue === 'string' ? newValue :  (newValue as { _id: string })._id;
        const userDoc = await this.userModel.findOne({_id:userId}).select('name').exec();
        const newName = userDoc?.name || userId;
    
        const createdById = typeof existingPriority.createdBy === 'string'
  ? existingPriority.createdBy
  : existingPriority.createdBy?._id;
        const oldUserDoc = await this.userModel.findOne({_id:createdById}).select('name').exec();
        const oldName = oldUserDoc?.name || existingPriority.createdBy?.toString() || 'Unknown';
    
        historyRecords.push({
          priorityId: id,
          field,
          previousValue: oldName,
          updatedValue: newName,
          updatedBy
        });
    
        continue; // Skip default handling for 'createdBy'
      }
        const oldValue = existingPriority[field];
        
        if (JSON.stringify(oldValue) === JSON.stringify(newValue)) {
            continue;
        }

      // Special handling for startWeek and endWeek changes
      if ((field === 'startWeek' || field === 'endWeek') ) {
        historyRecords.push({
          priorityId: id,
          field,
          previousValue: valueToString(existingPriority[field]) || 'Not set',
          updatedValue: valueToString(newValue),
          updatedBy:  new Types.ObjectId(user.userId) || 'system'
        });
        continue;
      }
   
      if (field === 'weeklyStatus' && Array.isArray(newValue) ) {
     
        const oldWeekStatus = existingPriority.weekStatusdata || [];
   
       // Find changed weeks
            newValue.forEach((newWeek, index) => {
                const oldWeek = oldWeekStatus[index];
                if (oldWeek && newWeek.status !== oldWeek.status) {
                    historyRecords.push({
                        priorityId: id,
                        field: `Week ${newWeek.intervalIndex} Status`,
                        previousValue: oldWeek.status,
                        updatedValue: newWeek.status,
                        updatedBy
                    });
                }
            });
            continue
      }

        if(field!=='weekStatusdata'){
        historyRecords.push({
                priorityId: id,
                field,
              previousValue: oldValue,
                updatedValue: newValue,
                updatedBy
            });
          }
    }
    
    if (historyRecords.length > 0) {
      try {
        await this.priorityHistoryModel.insertMany(historyRecords);
      } catch (error) {
        console.error('Error saving priority history:', error);
        throw new Error('Failed to save priority history');
      }
    }
   
    const query = { _id: id };
    if (user?.organizationId) {
      query['organizationId'] = user.organizationId;
    }
  //  console.log("query", query)
  //  console.log("updatePriorityDto", updatePriorityDto)
   
    const updatedPriority = await this.priorityModel
      .findOneAndUpdate(query, updatePriorityDto, { new: true })
      .exec();
   
    if (!updatedPriority) {
      throw new Error('Priority not found or access denied');
    }
    return updatedPriority;
  }

  async updateWeekStatus(
    id: string,
    updateWeekStatusDto: UpdateWeekStatusDto,
    user: any,
  ): Promise<Priority> {
    const existingPriority = await this.priorityModel.findById(id).exec();
    if (!existingPriority) {
      throw new Error('Priority not found');
    }

    // Prepare update object
    const updateData: any = {
      lastUpdatedBy: user?.sub ? new Types.ObjectId(user.sub) : undefined,
    };

    const updatedWeekStatus = existingPriority.weekStatusdata.map(w => {
    // Handle both Mongoose subdocuments and plain objects
    const weekData = (w as any).toObject ? (w as any).toObject() : { ...w };
    return weekData;
  });
    const historyRecords = [];

    // Process each week status update
    for (const update of updateWeekStatusDto.weekStatusUpdates) {
      const weekIndex = updatedWeekStatus.findIndex(
        (w) => w.intervalIndex === update.intervalIndex,
      );

      if (weekIndex === -1) {
        throw new Error(`Week with intervalIndex ${update.intervalIndex} not found`);
      }

      const existingWeek = updatedWeekStatus[weekIndex];

      // Check if there are actual changes
      if (
        update.status !== existingWeek.status ||
        update.description !== existingWeek.description
      ) {
        // Create history record before updating
        historyRecords.push({
          priorityId: id,
          field: `Week ${update.intervalIndex +1} Status`,
          previousValue: existingWeek.status,
          updatedValue: update.status,
          
          updatedBy: {
            id: user?.sub || 'system',
            name: user?.name || 'system',
          },
        });

        // Update the week status
        updatedWeekStatus[weekIndex] = {
          ...existingWeek,
          status: update.status,
          description: update.description || existingWeek.description,
          lastUpdatedBy: user?.sub ? new Types.ObjectId(user.sub) : undefined,
          lastUpdatedAt: new Date(),
        };
      }
    }

    // Only update if there were changes
    if (historyRecords.length > 0) {
      updateData.weekStatusdata = updatedWeekStatus;

      // Update priority status based on week status changes if needed
      const allWeeksCompleted = updatedWeekStatus.every(
        (week) => week.status === 'Complete',
      );
      if (allWeeksCompleted) {
        updateData.status = 'Completed';
      }

      // Save history records
      try {
        await this.priorityHistoryModel.insertMany(historyRecords);
      } catch (error) {
        console.error('Error saving priority history:', error);
        throw new Error('Failed to save priority history');
      }

      // Update the priority
      const query = { _id: id };
      if (user?.organizationId) {
        query['organizationId'] = user.organizationId;
      }

      const updatedPriority = await this.priorityModel
        .findOneAndUpdate(query, updateData, { new: true })
        .exec();

      if (!updatedPriority) {
        throw new Error('Priority not found or access denied');
      } else {
        const ownerMail = await this.userModel.findById(new Types.ObjectId(existingPriority.owner)).exec();
        let mailObject = {
          // recipients: [ownerMail.email],    // Actual Mail Id
          recipients: ['kirado9833@ofacer.com', 'akashsunhare2@gmail.com'],     // Testing
          subject: "Update Priorities",
          data: ownerMail.name
        }
        // this.emailService.updatePrioritiesEmail(mailObject);
      }
      return updatedPriority;
    }
    // Return existing priority if no changes were made
    return existingPriority;
  }

  async remove(id: string): Promise<Priority> {
    return this.priorityModel.findByIdAndDelete(id).exec();
  }

  async findHistory(id: string): Promise<PriorityHistory[]> {
    return this.priorityHistoryModel.find({ priorityId: id })
      .sort({ createdAt: -1 })
      .exec();
  }
}