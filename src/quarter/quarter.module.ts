import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuartersController } from './quarter.controller';
import { QuarterService } from './quarter.service';
import { Quarter, QuarterSchema } from './entities/quarter.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Quarter.name, schema: QuarterSchema }])
  ],
  controllers: [QuartersController],
  providers: [QuarterService],
  exports: [QuarterService, MongooseModule,],
})
export class QuartersModule {}
