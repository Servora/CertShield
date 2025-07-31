import { IsString, IsUUID, IsEmail, IsOptional, IsDateString, IsObject, IsEnum, IsArray, IsUrl, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CertificateType } from '../enums/certificate-type.enum';
import { CertificateStatus } from '../enums/certificate-status.enum';


export class CreateCertificateDto {
  @ApiProperty({ example: 'Web Development Certificate', description: 'Certificate title' })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: 'This certificate is awarded for completing the Web Development Course', description: 'Certificate description' })
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  description: string;

  @ApiProperty({ example: 'ABC Institute', description: 'Name of the issuing organization' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  issuerName: string;

  @ApiProperty({ example: 'John Doe', description: 'Name of the certificate recipient' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  recipientName: string;

  @ApiProperty({ example: 'john.doe@example.com', description: 'Email of the certificate recipient' })
  @IsEmail()
  recipientEmail: string;

  @ApiProperty({ example: '2023-01-01', description: 'Date when the certificate was issued' })
  @IsDateString()
  issueDate: Date;

  @ApiPropertyOptional({ example: '2025-01-01', description: 'Optional expiry date for the certificate' })
  @IsOptional()
  @IsDateString()
  expiryDate?: Date;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'UUID of the certificate issuer' })
  @IsUUID()
  issuerId: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'UUID of the certificate recipient' })
  @IsOptional()
  @IsUUID()
  recipientId?: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'UUID of the certificate template' })
  @IsUUID()
  templateId: string;

  @ApiPropertyOptional({ example: 'achievement', enum: CertificateType, description: 'Type of certificate' })
  @IsOptional()
  @IsEnum(CertificateType)
  type?: CertificateType;

  @ApiPropertyOptional({ example: 'https://example.com/certificate-image.jpg', description: 'URL to certificate image' })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Additional metadata for the certificate' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Custom template data for certificate generation' })
  @IsOptional()
  @IsString()
  customTemplateData?: string;

  @ApiPropertyOptional({ type: [String], description: 'Array of asset URLs for the certificate' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assetUrls?: string[];

   @ApiPropertyOptional({
    example: CertificateStatus.PENDING,
    enum: CertificateStatus,
    description: 'Lifecycle status of the certificate',
  })
  @IsOptional()
  @IsEnum(CertificateStatus)
  status?: CertificateStatus;

  @ApiPropertyOptional({ description: 'Blockchain-specific metadata' })
  @IsOptional()
  @IsObject()
  blockchainMetadata?: Record<string, any>;
} 