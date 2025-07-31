import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Institution } from './entities/institution.entity';
import { Document } from './entities/document.entity';
import { InstitutionService } from './services/institution.service';
import { InstitutionController } from './controllers/institution.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Institution, Document])],
  providers: [InstitutionService],
  controllers: [InstitutionController],
  exports: [InstitutionService],
})
export class InstitutionModule {}
