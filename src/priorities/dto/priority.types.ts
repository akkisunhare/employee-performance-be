import mongoose, { Types } from "mongoose";

export const PRIORITY_STATUSES = ['Not yet started', 'On track', 'Behind schedule', 'Complete', 'Not applicable'] as const;
export type PriorityStatus = typeof PRIORITY_STATUSES[number];

export const WeekIntervalSchema = new mongoose.Schema(
  {
    intervalIndex: { type: Number, required: true },
    intervalName: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
  },
  { _id: false }
);

export interface WeekInterval {
  intervalIndex: number;
  intervalName: string;
  startDate: Date;
  endDate: Date;
}
export interface WeekStatusData {
  intervalIndex: number;
  intervalName: string;
  startDate: Date;
  endDate: Date;
  status: PriorityStatus | 'Not able to store';
  description?: string;
  lastUpdatedBy?: Types.ObjectId;
  lastUpdatedAt?: Date;
}

export interface Priority extends Document {
  organizationId: string;
  name: string;
  owner: Types.ObjectId;
  team?: Types.ObjectId;
  quarter: string;
  startWeek: WeekInterval;
  endWeek: WeekInterval;
  description?: string;
  type: 'individual' | 'team' | 'company';
  status: PriorityStatus;
  createdBy?: Types.ObjectId;
  lastUpdatedBy?: Types.ObjectId;
  quarterStartDate: Date;
  quarterEndDate: Date;
  weeklyStatus: Array<{
    updateStartWeek: string;
    updateEndWeek: string;
    updateStatus: PriorityStatus;
    updateDescription?: string;
  }>;
  weekStatusdata: WeekStatusData[];
  isDeleted: boolean;
  deletedBy?: Types.ObjectId;
  deletedAt?: Date;
}
