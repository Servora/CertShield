import { IsString } from 'class-validator';

export class VerifyInstitutionDto {
  @IsString()
  note: string;
}
