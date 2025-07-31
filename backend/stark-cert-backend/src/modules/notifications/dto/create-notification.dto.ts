import { IsString, IsOptional, IsEnum, IsUUID, IsDateString, IsObject, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationType, NotificationPriority, NotificationCategory } from '../entities/notification.entity';

export class RecipientDto {
  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;
}

export class CreateNotificationDto {
  @IsUUID()
  userId: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @IsEnum(NotificationCategory)
  category: NotificationCategory;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @ValidateNested()
  @Type(() => RecipientDto)
  recipients?: RecipientDto;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  @IsObject()
  templateData?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  channels?: string[];
} 