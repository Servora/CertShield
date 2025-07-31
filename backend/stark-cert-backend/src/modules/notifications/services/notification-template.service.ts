import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationTemplate } from '../entities/notification-template.entity';
import * as handlebars from 'handlebars';

export interface CreateTemplateDto {
  name: string;
  type: 'email' | 'sms' | 'in_app';
  subject?: string;
  content: string;
  htmlContent?: string;
  variables: string[];
  isActive: boolean;
  category: string;
}

export interface UpdateTemplateDto {
  name?: string;
  subject?: string;
  content?: string;
  htmlContent?: string;
  variables?: string[];
  isActive?: boolean;
  category?: string;
}

@Injectable()
export class NotificationTemplateService {
  private readonly logger = new Logger(NotificationTemplateService.name);

  constructor(
    @InjectRepository(NotificationTemplate)
    private templateRepository: Repository<NotificationTemplate>,
  ) {}

  async createTemplate(createDto: CreateTemplateDto): Promise<NotificationTemplate> {
    const template = this.templateRepository.create({
      ...createDto,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await this.templateRepository.save(template);
  }

  async updateTemplate(id: string, updateDto: UpdateTemplateDto): Promise<NotificationTemplate> {
    await this.templateRepository.update(id, {
      ...updateDto,
      updatedAt: new Date(),
    });

    return await this.templateRepository.findOne({ where: { id } });
  }

  async getTemplate(id: string): Promise<NotificationTemplate> {
    return await this.templateRepository.findOne({ where: { id } });
  }

  async getTemplatesByType(type: 'email' | 'sms' | 'in_app'): Promise<NotificationTemplate[]> {
    return await this.templateRepository.find({
      where: { type, isActive: true },
      order: { name: 'ASC' },
    });
  }

  async getTemplatesByCategory(category: string): Promise<NotificationTemplate[]> {
    return await this.templateRepository.find({
      where: { category, isActive: true },
      order: { name: 'ASC' },
    });
  }

  async deleteTemplate(id: string): Promise<void> {
    await this.templateRepository.delete(id);
  }

  async renderTemplate(
    templateId: string,
    data: Record<string, any>,
  ): Promise<{ subject?: string; content: string; htmlContent?: string }> {
    const template = await this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const result: { subject?: string; content: string; htmlContent?: string } = {
      content: template.content,
    };

    // Render subject if it exists
    if (template.subject) {
      const subjectTemplate = handlebars.compile(template.subject);
      result.subject = subjectTemplate(data);
    }

    // Render content
    const contentTemplate = handlebars.compile(template.content);
    result.content = contentTemplate(data);

    // Render HTML content if it exists
    if (template.htmlContent) {
      const htmlTemplate = handlebars.compile(template.htmlContent);
      result.htmlContent = htmlTemplate(data);
    }

    return result;
  }

  async getDefaultTemplates(): Promise<NotificationTemplate[]> {
    const defaultTemplates = [
      {
        name: 'Certificate Issued Email',
        type: 'email' as const,
        subject: 'Certificate Issued - {{certificateName}}',
        content: 'Your certificate {{certificateName}} has been issued successfully.',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">Certificate Issued</h2>
            <p>Dear {{recipientName}},</p>
            <p>Your certificate <strong>{{certificateName}}</strong> has been issued successfully.</p>
            <p><strong>Certificate Details:</strong></p>
            <ul>
              <li>Certificate ID: {{certificateId}}</li>
              <li>Issue Date: {{issueDate}}</li>
              <li>Expiry Date: {{expiryDate}}</li>
              <li>Issuer: {{issuerName}}</li>
            </ul>
            <p>You can view and download your certificate from your dashboard.</p>
            <p>Best regards,<br>CertShield Team</p>
          </div>
        `,
        variables: ['recipientName', 'certificateName', 'certificateId', 'issueDate', 'expiryDate', 'issuerName'],
        isActive: true,
        category: 'certificate_issued',
      },
      {
        name: 'Certificate Expiry Warning',
        type: 'email' as const,
        subject: 'Certificate Expiry Warning - {{certificateName}}',
        content: 'Your certificate {{certificateName}} will expire on {{expiryDate}}.',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #e74c3c;">Certificate Expiry Warning</h2>
            <p>Dear {{recipientName}},</p>
            <p>Your certificate <strong>{{certificateName}}</strong> will expire on <strong>{{expiryDate}}</strong>.</p>
            <p>Please renew your certificate before the expiry date to maintain its validity.</p>
            <p><strong>Certificate Details:</strong></p>
            <ul>
              <li>Certificate ID: {{certificateId}}</li>
              <li>Days until expiry: {{daysUntilExpiry}}</li>
              <li>Issuer: {{issuerName}}</li>
            </ul>
            <p>Best regards,<br>CertShield Team</p>
          </div>
        `,
        variables: ['recipientName', 'certificateName', 'certificateId', 'expiryDate', 'daysUntilExpiry', 'issuerName'],
        isActive: true,
        category: 'certificate_expired',
      },
      {
        name: 'Certificate Revoked SMS',
        type: 'sms' as const,
        content: 'ALERT: Certificate {{certificateName}} has been revoked. Contact support for details.',
        variables: ['certificateName'],
        isActive: true,
        category: 'certificate_revoked',
      },
      {
        name: 'System Maintenance',
        type: 'email' as const,
        subject: 'System Maintenance Notice',
        content: 'Scheduled maintenance will occur on {{maintenanceDate}} from {{startTime}} to {{endTime}}.',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f39c12;">System Maintenance Notice</h2>
            <p>Dear {{recipientName}},</p>
            <p>We will be performing scheduled maintenance on <strong>{{maintenanceDate}}</strong> from <strong>{{startTime}}</strong> to <strong>{{endTime}}</strong>.</p>
            <p>During this time, some services may be temporarily unavailable.</p>
            <p>We apologize for any inconvenience and appreciate your patience.</p>
            <p>Best regards,<br>CertShield Team</p>
          </div>
        `,
        variables: ['recipientName', 'maintenanceDate', 'startTime', 'endTime'],
        isActive: true,
        category: 'system_maintenance',
      },
    ];

    // Check if default templates exist, if not create them
    for (const templateData of defaultTemplates) {
      const existingTemplate = await this.templateRepository.findOne({
        where: { name: templateData.name },
      });

      if (!existingTemplate) {
        await this.createTemplate(templateData);
      }
    }

    return await this.templateRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async validateTemplate(templateId: string, testData: Record<string, any>): Promise<boolean> {
    try {
      await this.renderTemplate(templateId, testData);
      return true;
    } catch (error) {
      this.logger.error(`Template validation failed for ${templateId}`, error);
      return false;
    }
  }

  async getTemplateVariables(templateId: string): Promise<string[]> {
    const template = await this.getTemplate(templateId);
    return template?.variables || [];
  }
} 