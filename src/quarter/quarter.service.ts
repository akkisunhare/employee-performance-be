import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Quarter, QuarterDocument } from './entities/quarter.schema';
import { CreateQuarterDto, CreateQuarterDtoNew } from './dto/create-quarter.dto';
import { UpdateQuarterDto } from './dto/update-quarter.dto';
import { Response } from 'express';
import { ApiResponse } from '../types/api-response.interface';
import { generate91DayQuarters } from './quarter.utils';
@Injectable()
export class QuarterService {
  constructor(
    @InjectModel(Quarter.name) private quarterModel: Model<QuarterDocument>,
    @InjectModel(Quarter.name) private quarterModelNew: Model<Quarter>
  ) {}

  async create(dto: CreateQuarterDto): Promise<ApiResponse<Quarter>> {
    const startDate = dto.start_date;
    const endDate = dto.end_date;
 
    const existing = await this.quarterModel.findOne({
      quarter: dto.quarter,
      year: dto.year,
      organizationId: dto.organizationId, 
    });
  
    if (existing) {
      throw new HttpException(
        {
          success: false,
          message: `Quarter ${dto.quarter} for year ${dto.year} already exists.`,
          data: null
        },
        HttpStatus.FORBIDDEN
      );
    }
  
    const quarter = new this.quarterModel({
      ...dto,
      start_date: startDate,
      end_date: endDate,
    });

    await quarter.save();

    return {
      success: true,
      message: 'Quarter created successfully.',
      data: quarter,
    };
  }

  async findAll(organizationId: string): Promise<ApiResponse<Quarter[]>> {
    try {
      const quarters = await this.quarterModel.find({ organizationId }).exec();
      return {
        success: true,
        message: 'Quarters retrieved successfully',
        data: quarters
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Error retrieving quarters',
          data: null
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async findOne(id: string, organizationId: string): Promise<ApiResponse<Quarter>> {
    try {
      const quarter = await this.quarterModel.findOne({ _id: id, organizationId }).exec();
      if (!quarter) {
        throw new HttpException(
          {
            success: false,
            message: 'Quarter not found',
            data: null
          },
          HttpStatus.NOT_FOUND
        );
      }
      return {
        success: true,
        message: 'Quarter retrieved successfully',
        data: quarter
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Error retrieving quarter',
          data: null
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async findByYearOrQuarter(
    year?: number,
    quarter?: string,
    organizationId?: string
  ): Promise<ApiResponse<Quarter[]>> {
    try {
      if (!organizationId) {
        throw new HttpException(
          {
            success: false,
            message: 'Organization ID is required',
            data: null
          },
          HttpStatus.BAD_REQUEST
        );
      }

      const filter: any = { organizationId };

      if (year) {
        filter.year = year;
      }

      if (quarter) {
        filter.quarter = quarter;
      } 

      const quarters = await this.quarterModel.find(filter).exec();
      return {
        success: true,
        message: 'Quarters retrieved successfully',
        data: quarters
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Error retrieving quarters',
          data: null
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async update(
    id: string,
    dto: UpdateQuarterDto,
    organizationId: string,
  ): Promise<any> {
    try {
      const quarter = await this.quarterModel.findOne({ _id: id, organizationId });
      const quarters = await this.quarterModel.find({ organizationId });
      if (!quarter) {
        throw new HttpException(
          {
            success: false,
            message: 'Quarter not found',
            data: null,
          },
          HttpStatus.NOT_FOUND,
        );
      }
  
      if (dto.start_date) {
        const startDate = new Date(dto.start_date);
        startDate.setUTCHours(0, 0, 0, 0); // Set to midnight UTC (00:00:00)
  
        // Calculate the end date as 91 days after the start date
        const endDate = new Date(startDate);
        endDate.setUTCDate(startDate.getUTCDate() + 90); // 90 days after the start date
  
        // Ensure start date is before end date
        if (startDate >= endDate) {
          throw new HttpException(
            {
              success: false,
              message: 'Start date must be before end date.',
              data: null,
            },
            HttpStatus.BAD_REQUEST,
          );
        }
        const quarterOrder = { q1: 1, q2: 2, q3: 3, q4: 4 };
        const currentQuarterOrder = quarterOrder[quarter.quarter.toLowerCase()];
        const currentYear = quarter.year;
        
        const overlappingQuarter = quarters.find(q => {
          if (q._id.toString() === id) return false;
        
          const existingStart = new Date(q.start_date);
          const existingEnd = new Date(q.end_date);
        
          const qOrder = quarterOrder[q.quarter.toLowerCase()];
          const qYear = q.year;
        
          // Only check quarters from the same year with a lower quarter order
          const isPreviousQuarter =
            qYear === currentYear && qOrder < currentQuarterOrder;
        
          if (!isPreviousQuarter) return false;
        
          // Check for overlap
          return !(endDate < existingStart || startDate > existingEnd);
        });
        
        if (overlappingQuarter) {
          throw new HttpException(
            {
              success: false,
              message: `Date range overlaps with ${overlappingQuarter.quarter.toUpperCase()} (${overlappingQuarter.start_date} to ${overlappingQuarter.end_date})`,
              data: null,
            },
            HttpStatus.BAD_REQUEST,
          );
        }
        // Update start and end date in DTO
        dto.start_date = startDate.toISOString();
        dto.end_date = endDate.toISOString();
      }
  
      // Assign updated quarter information
      Object.assign(quarter, dto);
      const updatedQuarter = await quarter.save();
  
      // Now update the future quarters based on the updated quarter's dates
      await this.updateFutureQuarters(updatedQuarter);
  
      return {
        success: true,
        message: 'Quarter updated successfully',
        data: updatedQuarter,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Error updating quarter',
          data: null,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  
  private async updateFutureQuarters(updatedQuarter: QuarterDocument): Promise<void> {
    // Define quarter order for sorting
    const quarterOrder: Record<string, number> = { q1: 1, q2: 2, q3: 3, q4: 4 };
  
    // Fetch all quarters for the same year and organization
    const allQuarters = await this.quarterModel.find({
      year: updatedQuarter.year,
      organizationId: updatedQuarter.organizationId,
    }).lean(); // use lean() for performance and to allow custom sorting
  
    // Sort quarters by defined quarter order
    allQuarters.sort((a, b) => quarterOrder[a.quarter] - quarterOrder[b.quarter]);
  
    // Find the index of the updated quarter
    const updatedQuarterIndex = allQuarters.findIndex(
      (q) => q._id.toString() === updatedQuarter._id.toString()
    );
  
    if (updatedQuarterIndex === -1) return;
  
    // Get the quarters that come after the updated quarter
    const futureQuarters = allQuarters.slice(updatedQuarterIndex + 1);
  
    // Start with the updated quarter's end date
    let lastEndDate = new Date(updatedQuarter.end_date);
  
    // Update each future quarter
    for (const fq of futureQuarters) {
      const nextQuarterStartDate = new Date(lastEndDate);
      nextQuarterStartDate.setUTCDate(lastEndDate.getUTCDate() + 1);
  
      const nextQuarterEndDate = new Date(nextQuarterStartDate);
      nextQuarterEndDate.setUTCDate(nextQuarterStartDate.getUTCDate() + 90);
  
      // Update the future quarter's dates in DB
      await this.quarterModel.updateOne(
        { _id: fq._id },
        {
          $set: {
            start_date: nextQuarterStartDate.toISOString(),
            end_date: nextQuarterEndDate.toISOString(),
          },
        }
      );
  
      lastEndDate = nextQuarterEndDate;
    }
  }

  async remove(id: string, organizationId: string): Promise<ApiResponse<null>> {
    try {
      const result = await this.quarterModel.deleteOne({ _id: id, organizationId }).exec();
      if (result.deletedCount === 0) {
        throw new HttpException(
          {
            success: false,
            message: 'Quarter not found',
            data: null
          },
          HttpStatus.NOT_FOUND
        );
      }
      return {
        success: true,
        message: 'Quarter deleted successfully',
        data: null
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Error deleting quarter',
          data: null
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async checkAndCreateQuartersOnLogin(userId: string, organizationId: string): Promise<ApiResponse<null>> {
    const year = new Date().getFullYear();

    try {
      const existingQuarters = await this.quarterModel.find({
        year,
        organizationId,
      });

      if (existingQuarters.length >= 4) {
        return {
          success: true,
          message: 'Quarters already exist for this year',
          data: null
        };
      }

      const quarters = generate91DayQuarters(year);

      for (const q of quarters) {
        const exists = await this.quarterModel.findOne({
          quarter: q.quarter,
          year: q.year,
          organizationId,
        });

        if (!exists) {
          await new this.quarterModel({
            ...q,
            organizationId,
          }).save();
        }
      }

      return {
        success: true,
        message: `Default quarters created for organization ${organizationId}`,
        data: null
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Error checking and creating quarters',
          data: null
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async updateQuarterAndNext(dto: CreateQuarterDtoNew) {
    const baseStartDate = new Date(dto.start_date);
    const baseEndDate = new Date(dto.end_date);
    const year = baseStartDate.getFullYear();

    const quarterOrder = ['Q1', 'Q2', 'Q3', 'Q4'];
    const currentIndex = quarterOrder.indexOf(dto.quarter);

    if (currentIndex === -1) {
      throw new Error(`Invalid quarter: ${dto.quarter}`);
    }
    const quartersToUpdate = [];

    // Push the current quarter
    quartersToUpdate.push({
      quarter: dto.quarter,
      year,
      start_date: baseStartDate,
      end_date: baseEndDate,
    });

    // Calculate next quarters dynamically based on end_date
    let prevEnd = baseEndDate;

    for (let i = currentIndex + 1; i < 4; i++) {
      const qName = quarterOrder[i];
      const nextStart = new Date(prevEnd);
      nextStart.setDate(nextStart.getDate() + 1);

      const nextEnd = new Date(nextStart);
      nextEnd.setMonth(nextEnd.getMonth() + 3);
      nextEnd.setDate(nextEnd.getDate() - 1); // last day of the 3-month period

      quartersToUpdate.push({
        quarter: qName,
        year,
        start_date: nextStart,
        end_date: nextEnd,
      });

      prevEnd = nextEnd;
    }

    // Upsert quarters based on quarter name + year
    const results = await Promise.all(
      quartersToUpdate.map(async (q) => {
        return this.quarterModelNew.findOneAndUpdate(
          { quarter: q.quarter, year: q.year },
          { $set: q },
          { upsert: true, new: true }
        );
      })
    );
    return {
      success: true,
      message: 'Quarter Created successfully.',
      data: results,
    };
  }
}
