import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Patch,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InstitutionService } from '../services/institution.service';
import { CreateInstitutionDto } from '../dto/create-institution.dto';
import { UpdateInstitutionDto } from '../dto/update-institution.dto';
import { VerifyInstitutionDto } from '../dto/verify-institution.dto';
@Controller('institutions')
export class InstitutionController {
  constructor(private readonly institutionService: InstitutionService) {}

  @Post('register')
  async register(@Body() dto: CreateInstitutionDto) {
    return this.institutionService.register(dto);
  }

  @Get(':id')
  async getInstitution(@Param('id', ParseUUIDPipe) id: string) {
    return this.institutionService.getInstitutionById(id);
  }

  @Patch(':id/update')
  async updateInstitution(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInstitutionDto,
  ) {
    return this.institutionService.updateInstitution(id, dto);
  }

  @Patch(':id/verify')
  @UseInterceptors(FileInterceptor('document'))
  async verifyInstitution(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: VerifyInstitutionDto,
  ) {
    return this.institutionService.verifyInstitution(id, dto, file);
  }
}
