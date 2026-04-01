import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { PRIORITY_STATUSES, PriorityStatus, WeekInterval, WeekIntervalSchema, WeekStatusData } from '../dto/priority.types';

// export type PriorityDocument = Priority & Document;

// @Schema({ timestamps: true })
// export class Priority {
//   @Prop({ required: true })
//   organizationId: string;

//   @Prop({ required: true })
//   name: string;

//   @Prop({ required: false })
//   owner: string;

//   @Prop({ required: false })
//   ownerRole: string;

//   @Prop({ required: true })
//   priorityCreateRole: string;

//   @Prop({ required: false })
//   team: string;

//   @Prop({ required: false })
//   teamOwnerId: string;

//   @Prop({ required: true })
//   quarter: string;

//   @Prop({ required: true })
//   startDate: Date;

//   @Prop({ required: true })
//   endDate: Date;

//   @Prop({ required: true })
//   startWeek: string;

//   @Prop({ required: true })
//   endWeek: string;

//   @Prop()
//   description: string;

//   @Prop({ required: true, enum: ['individual', 'team', 'company'] })
//   type: string;

//   @Prop({ required: true, enum: ['Not yet started', 'On track', 'Behind schedule', 'Complete', 'Not applicable'], default: 'Not yet started' })
//   status: string;
  
//   @Prop({ type: Types.ObjectId, ref: 'User', required: false })
//   createdBy: Types.ObjectId; 

//   @Prop({ type: Types.ObjectId, ref: 'User', required: false })
//   lastUpdatedBy?: Types.ObjectId;

//   @Prop({required:true})
//   quarterStartDate: string;
  
//   @Prop({required:true})
//   quarterEndDate: string;
  
//   @Prop([
//     {
//       updateStartWeek: String,
//       updateEndWeek: String,
//       updateStatus: {
//         type: String,
//         enum: ['Not yet started', 'On track', 'Behind schedule', 'Complete', 'Not applicable']
//       },
//       updateDescription: {
//         type: String,
//         required: false
//       }
//     }
//   ])
//   weeklyStatus: Array<{
//     updateStartWeek: string;
//     updateEndWeek: string;
//     updateStatus: string;
//     updateDescription?: string;
//   }>;

//   @Prop([
//     {
//       week: String,
//       status: {
//         type: String,
//         enum: ['Not yet started', 'On track', 'Behind schedule', 'Complete', 'Not applicable', 'Not able to store']
//       },
//       description: {
//         type: String,
//         required: false
//       }
//     }
//   ])
//   weekStatusdata: Array<{
//     week: string;
//     status: string;
//     description?: string;
//   }>;
// }

// export const PrioritySchema = SchemaFactory.createForClass(Priority);




export type PriorityDocument = Priority & Document;

@Schema({ timestamps: true })
export class Priority {
  @Prop({ required: true })
  organizationId: string;

  @Prop({ required: true })
  name: string;

  @Prop({type: Types.ObjectId, ref: 'User',  required: true })
  owner:Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Team', required: false })
  team: Types.ObjectId;

  @Prop({ required: true })
  quarter: string;


 @Prop({
  required: true,
  type: WeekIntervalSchema
})
startWeek: WeekInterval

@Prop({
  required: true,
  type: WeekIntervalSchema
})
endWeek:WeekInterval
  @Prop()
  description: string;

  @Prop({ required: true, enum: ['individual', 'team', 'company'] })
  type: string;

  @Prop({ required: true, enum: PRIORITY_STATUSES, default: 'Not yet started' })
  status: PriorityStatus;
  
  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  createdBy: Types.ObjectId; 

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  lastUpdatedBy?: Types.ObjectId;

  @Prop({required:true})
  quarterStartDate: Date;
  
  @Prop({required:true})
  quarterEndDate: Date;
  
  @Prop([
    {
      updateStartWeek: String,
      updateEndWeek: String,
      updateStatus: {
        type: String,
        enum:PRIORITY_STATUSES
      },
      updateDescription: {
        type: String,
        required: false
      }
    }
  ])
  weeklyStatus: Array<{
    updateStartWeek: string;
    updateEndWeek: string;
    updateStatus: string;
    updateDescription?: string;
  }>;

   @Prop({
    type: [
      new mongoose.Schema(
        {
          intervalIndex: { type: Number, required: true },
          intervalName:{type:String ,required: true},
          startDate: { type: Date, required: true },
          endDate: { type: Date, required: true },
          status: {
            type: String,
            enum: [...PRIORITY_STATUSES, 'Not able to store'],
            required: true,
          },
          description: { type: String, required: false },
          lastUpdatedBy: { type: Types.ObjectId, ref: 'User', required: false },
        lastUpdatedAt: { type: Date, required: false },
        },
        { _id: false }
      ),
    ],
  })
  weekStatusdata: WeekStatusData[];

  @Prop({ default: false })
isDeleted: boolean;

@Prop({ type: Types.ObjectId, ref: 'User', required: false })
deletedBy?: Types.ObjectId;

@Prop({ type: Date, required: false })
deletedAt?: Date;
}

export const PrioritySchema = SchemaFactory.createForClass(Priority);

PrioritySchema.methods.softDelete = function (userId: Types.ObjectId) {
  this.isDeleted = true;
  this.deletedBy = userId;
  this.deletedAt = new Date();
  return this.save();
};

PrioritySchema.index({ organizationId: 1 });
PrioritySchema.index({ isDeleted: 1 });
// PrioritySchema.query.notDeleted = function () {
//   return this.where({ isDeleted: false });
// };

// for use
// await priority.softDelete(currentUser._id);