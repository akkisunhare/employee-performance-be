import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';

@Schema({ timestamps: true, discriminatorKey: 'kpiType' })
export class Kpi extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ type: Object, required: true })
  ownerId: { id: string; name: string };

  @Prop({ required: true, enum: ['number', 'percentage'] })
  measurementUnit: string;

  @Prop({ required: false, default: "" })
  currencyType: string;

  @Prop({ required: true })
  targetValue: number;

  @Prop({ required: true })
  initialTargetValue: number;

  @Prop({default:0})
  currentValue: number;

   @Prop({ required: true ,default:0})
  initialCurrentValue: number;
  
  @Prop({ required: true, enum: ['standalone', 'cumulative'] })
  divisionType: string;

  @Prop({required:true})
  quarter: string;

  @Prop({required:true})
  quarterStartDate: string;
  
  @Prop({required:true})
  quarterEndDate: string;

  @Prop({default:'0'}) 
  contribution: string;
  
  @Prop({default:'0'}) 
  remainingContribution: string;

  @Prop({ enum: ['daily', 'weekly', 'monthly', 'quarterly'] })
  frequency: string;

  @Prop({ type: Types.ObjectId, ref: 'Kpi', required: false })
  parentKpiId?: Types.ObjectId;
  
  @Prop({ type: String, required: false })
  parentKpiName?: string;

  @Prop({ type: Object })
  inheritedFields: {
    measurementUnit?: boolean;
    divisionType?: boolean;
    quarter?: boolean;
    frequency?: boolean;
  };

  
  @Prop({ required: true, enum: ['individual', 'team', 'company'] })
  kpiType: string;

  // @Prop({ required: false })
  // teamId?: string;
  
  @Prop({ type: Object, required: false })
  teamId?: { id: string; name: string };

  @Prop({ type: [{ id: String, name: String }], required: false })
  assigneeIds?: { id: string; name: string }[];

  @Prop({ type: [{ id: String, name: String }], required: false })
  teamIds?: { id: string; name: string }[];
  
  // @Prop({ type: [{ id: String, name: String kpiId:Types.ObjectId  ref: 'Organization',}] })
  // childKpis?: { id: string; name: string }[];

  @Prop({
    type: [
      {
        id: { type: String },
        name: { type: String },
        kpiId: { type: Types.ObjectId, ref: 'Organization' },
        kpiName:{type:String} // Correct reference to the Organization collection
      },
    ],
  })
  childKpis?: { id: string; name: string; kpiId: Types.ObjectId ,kpiName:string }[];

  @Prop({ type: Object, required: false })
  breakdownData?: {
      intervalIndex: number;
      intervalName: string;
      intervalContribution: number;
      intervalTarget: number;
      startDate: string;  // New field for interval start date
      endDate: string; 
      isUpdated:boolean;
      notes: string;
  }[];

 @Prop({ required: false })
  status?: Number;

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  createdBy: Types.ObjectId; 

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  lastUpdatedBy?: Types.ObjectId;
} 

export const KpiSchema = SchemaFactory.createForClass(Kpi);

KpiSchema.index({ name: 1 });

