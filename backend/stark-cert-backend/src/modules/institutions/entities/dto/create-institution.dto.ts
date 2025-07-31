export class CreateInstitutionDto {
  name: string;
  email: string;
  country: string;
}

// dto/verify-institution.dto.ts
export class VerifyInstitutionDto {
  institutionId: string;
  documents: { type: string; url: string }[];
}