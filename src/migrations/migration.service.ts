import { Injectable } from '@nestjs/common';
import { getModelToken, InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Kpi } from 'src/kpi/entities/kpi.entity';
import {
  Priority,
  PriorityDocument,
} from 'src/priorities/entity/priority.schema';
import { Quarter, QuarterDocument } from 'src/quarter/entities/quarter.schema';
import { Team } from 'src/teams/entities/team.entity';
// import { INestApplicationContext } from "@nestjs/common";

@Injectable()
export class MigrationService {
  constructor(
    @InjectModel(Kpi.name) private kpiModel: Model<Kpi>,
    // @InjectModel(Team.name) private teamModel: Model<Team>,
    // @InjectModel(Quarter.name) private QuatersModule: Model<QuarterDocument>,
    @InjectModel(Priority.name) private priorityModel: Model<PriorityDocument>,
    // private app: INestApplicationContext
  ) {}

  async runMigration(orgId: string, moduleName: string): Promise<any> {
    try {
      // return;
      const kpis = await this.kpiModel.find({
        'breakdownData.notes': { $exists: false },
        organizationId: orgId, // optionally use orgId if passed
      });
      console.log(`Found ${kpis.length} documents to update`);
      for (const kpi of kpis) {
        let updated = false;
        kpi.breakdownData = kpi.breakdownData.map((item: any) => {
          if (!('notes' in item)) {
            updated = true;
            return { ...item, notes: '' };
          }
          return item;
        });
        if (updated) {
          await kpi.save();
          console.log(`Updated KPI ${kpi._id}`);
        }
      }
      return { message: '✅ Migration completed.', updatedCount: kpis.length };
    } catch (err) {
      console.error('❌ Migration error:', err);
      throw err;
    }
  }

  async updateKpiAndPriority(orgId: string, userData: any) {
    try {
      console.log(orgId, userData , "Migration Started");
      
      let result: any = [];
      if (userData.moduleName === 'kpi') {
        const oldId = userData.oldId;
        const newId = userData.newId;
        result = await this.kpiModel.updateMany(
          { 
            "ownerId.id": oldId,
            organizationId: orgId
          },
          { $set: { "ownerId.id": newId } }
        );
      } else if (userData.moduleName === 'priority') {
        const oldId = new Types.ObjectId(userData.oldId);
        const newId = new Types.ObjectId(userData.newId);
        result = await this.priorityModel.updateMany(
          { 
            owner: oldId,
            organizationId: orgId  // ensure orgId exists and is not null
          },
          { $set: { owner: newId }}
        );
      }
      return { 
        message: '✅ Migration completed.',
        moduleName: userData.moduleName,
        updatedCount: result.modifiedCount };
    } catch (err) {
      console.error('Migration failed:', err);
    }
  }
}
