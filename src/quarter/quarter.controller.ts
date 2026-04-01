import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { QuarterService } from './quarter.service';
import { CreateQuarterDto, CreateQuarterDtoNew } from './dto/create-quarter.dto';
import { UpdateQuarterDto } from './dto/update-quarter.dto';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
import { Quarter } from './entities/quarter.schema';
import { ApiResponse } from '../types/api-response.interface';

@UseGuards(JwtAuthGuard)
@Controller('quarters')
export class QuartersController {
  constructor(private readonly service: QuarterService) {}

  @Post()
  @UsePipes(new ValidationPipe())
  async create(
    @Body() dto: CreateQuarterDto,
    @Req() req: any,
  ): Promise<ApiResponse<Quarter>> {
    const { organizationId, sub, name } = req.user;
    dto.organizationId = organizationId;
    dto.createdBy = { id: sub, name };
    return this.service.create(dto);
  }

  @Get()
  async findAll(@Req() req: any): Promise<ApiResponse<Quarter[]>> {
    const { organizationId } = req.user;
    return this.service.findAll(organizationId);
  }

  @Get('search')
  async findByYearOrQuarter(
    @Req() req: any,
    @Query('year') year?: string,
    @Query('quarter') quarter?: string,
  ): Promise<ApiResponse<Quarter[]>> {
    const { organizationId } = req.user;
    return this.service.findByYearOrQuarter(
      year ? parseInt(year) : undefined,
      quarter,
      organizationId
    );
  }
  
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<ApiResponse<Quarter>> {
    const { organizationId } = req.user;
    return this.service.findOne(id, organizationId);
  }

  @Put(':id')
  @UsePipes(new ValidationPipe())
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateQuarterDto,
    @Req() req: any,
  ): Promise<ApiResponse<Quarter>> {
    const { organizationId, sub, name } = req.user;
    dto.lastUpdatedBy = { id: sub, name };
    return this.service.update(id, dto, organizationId);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<ApiResponse<null>> {
    const { organizationId } = req.user;
    return this.service.remove(id, organizationId);
  }

  @Post('new-quarter')
  async createNew(@Body() dto: CreateQuarterDtoNew) {
    return this.service.updateQuarterAndNext(dto);
  }
}
