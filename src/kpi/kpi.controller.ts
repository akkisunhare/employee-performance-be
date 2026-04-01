import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  NotFoundException,
  Query,
  BadRequestException,
  HttpException,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { KpiService } from './kpi.service';
import { CreateKpiDto } from './dto/create-kpi.dto';
import { Kpi } from './entities/kpi.entity';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
import { KpiQueryDto } from './dto/kpi-query.dto.';
import { Response } from 'express';

@UseGuards(JwtAuthGuard)
@Controller('kpis')
export class KpiController {
  constructor(private readonly kpiService: KpiService) {}

  @Post()
  create(@Body() createKpiDto: CreateKpiDto, @Req() req: any): Promise<Kpi> {
    const {organizationId,sub,name }= req.user;
    createKpiDto.organizationId = organizationId;
    createKpiDto.userId = sub;
    createKpiDto.userName=name
    return this.kpiService.create(createKpiDto);
  }

  @Post('update-kpi/:id')
  updateKpi(@Param('id') id: string, @Body() updateKpiDto: any): Promise<Kpi> {
    return this.kpiService.updateIntervalKpi(id, updateKpiDto);
  }

  @Post('getAll')
  findAll( @Req() req: any, @Body() body: any ): Promise<any> {
    
    const userId = req.user.sub; 
    const orgId = req.user.organizationId;
    return this.kpiService.findAll( orgId,userId, body);
  }
  @Post('find-by-type')
  findAllByType( @Req() req: any, @Body() body: any ): Promise<any> {
    const userId = req.user.sub; 
    const orgId = req.user.organizationId;
    return this.kpiService.findAllByType( orgId, userId, body?.kpiType);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Kpi> {
    return this.kpiService.findOneKPI(id);
  }

  @Put(':id')
  update(
    @Param('id') kpiId: string,
    @Body() updateKpiDto: CreateKpiDto,
    @Req() req: any
  ): Promise<Kpi> {
    updateKpiDto.userId = req.user.sub;
    return this.kpiService.updateKpiDetails(kpiId, updateKpiDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<Kpi> {
    return this.kpiService.remove(id);
  }

//   @Get(':id/matching-parent-kpis')
// async findMatchingParentKpis(@Param('id') id: string) {
//   const kpi = await this.kpiService.findOneKPI(id);

//   if (!kpi) {
//     throw new NotFoundException('KPI not found');
//   }

//   let parentType: 'team' | 'company';

//   switch (kpi.kpiType) {
//     case 'individual':
//       parentType = 'team';
//       break;
//     case 'team':
//       parentType = 'company';
//       break;
//     default:
//       throw new BadRequestException('This KPI type does not support parent matching');
//   }

//   return this.kpiService.findMatchingParentKpis(kpi, parentType);
// }

  @Get(':id/matching-parent-kpis/:inputForm')
async findMatchingParentKpis(@Param('id') id: string, @Param('inputForm') inputForm?: boolean) {
  const kpi = await this.kpiService.findOneKPI(id);

  if (!kpi) {
    throw new NotFoundException('KPI not found');
  }

  let parentType: 'team' | 'company';

  switch (kpi.kpiType) {
    case 'individual':
      parentType = 'team';
      break;
    case 'team':
      parentType = 'company';
      break;
    default:
      throw new BadRequestException('This KPI type does not support parent matching');
  }

  return this.kpiService.findMatchingParentKpis(kpi, parentType,inputForm);
}
@Post(':id/link-to-parent/:parentKpiId/:type')
async linkIndividualToParent(
  @Param('id') individualKpiId: string,
  @Param('parentKpiId') parentKpiId: string,
  @Param('type') type: 'team' | 'company',
) {
  try {
    // Ensure that the correct type is passed
    let result;
    if (type === 'team') {
      result = await this.kpiService.linkKpiToParent(individualKpiId, parentKpiId, 'individual', 'team');
    } else if (type === 'company') {
      result = await this.kpiService.linkKpiToParent(individualKpiId, parentKpiId, 'team', 'company');
    } else {
      // Throw a proper exception if the type is invalid
      throw new HttpException('Invalid KPI type', HttpStatus.BAD_REQUEST);
    }
    if (!result) {
      throw new HttpException('Failed to link KPI to parent.', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return {
      success: true,
      message: 'KPI linked successfully.',
      data: result,
    };
  } catch (error) {
    // Catch all errors and send the response accordingly
    console.error(error);
      throw new HttpException(
        error?.message || 'Internal Server Error',
        error?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
  }
}

}
