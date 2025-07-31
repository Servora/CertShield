import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Institution } from './entities/institution.entity';
import { CreateInstitutionDto } from '../dto/create-institution.dto';
import { UpdateInstitutionDto } from '../dto/update-institution.dto';
import { VerifyInstitutionDto } from '../dto/verify-institution.dto';

@Injectable()
export class InstitutionService {
  constructor(
    @InjectRepository(Institution)
    private readonly institutionRepo: Repository<Institution>,
  ) {}

  async register(dto: CreateInstitutionDto): Promise<Institution> {
    const institution = this.institutionRepo.create(dto);
    return await this.institutionRepo.save(institution);
  }

  async getInstitutionById(id: string): Promise<Institution> {
    const institution = await this.institutionRepo.findOne({ where: { id } });
    if (!institution) throw new NotFoundException('Institution not found');
    return institution;
  }

  async updateInstitution(id: string, dto: UpdateInstitutionDto): Promise<Institution> {
    await this.institutionRepo.update(id, dto);
    return this.getInstitutionById(id);
  }

  async verifyInstitution(
    id: string,
    dto: VerifyInstitutionDto,
    file: Express.Multer.File,
  ): Promise<Institution> {
    const institution = await this.getInstitutionById(id);
    institution.verificationStatus = 'pending';
    institution.verificationFile = file?.path || '';
    institution.verificationNote = dto.note;
    return await this.institutionRepo.save(institution);
  }
}
