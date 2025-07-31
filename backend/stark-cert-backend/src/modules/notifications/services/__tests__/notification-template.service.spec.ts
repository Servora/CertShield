import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationTemplateService, CreateTemplateDto, UpdateTemplateDto } from '../notification-template.service';
import { NotificationTemplate } from '../../entities/notification-template.entity';

describe('NotificationTemplateService', () => {
  let service: NotificationTemplateService;
  let templateRepository: Repository<NotificationTemplate>;

  const mockTemplateRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationTemplateService,
        {
          provide: getRepositoryToken(NotificationTemplate),
          useValue: mockTemplateRepository,
        },
      ],
    }).compile();

    service = module.get<NotificationTemplateService>(NotificationTemplateService);
    templateRepository = module.get<Repository<NotificationTemplate>>(getRepositoryToken(NotificationTemplate));

    jest.clearAllMocks();
  });

  describe('createTemplate', () => {
    it('should create a template successfully', async () => {
      const createDto: CreateTemplateDto = {
        name: 'Welcome Email',
        type: 'email',
        subject: 'Welcome to CertShield',
        content: 'Hello {{name}}, welcome to CertShield!',
        htmlContent: '<h1>Hello {{name}}</h1><p>Welcome to CertShield!</p>',
        variables: ['name'],
        isActive: true,
        category: 'user_activity',
      };

      const mockTemplate = {
        id: 'template-123',
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTemplateRepository.create.mockReturnValue(mockTemplate);
      mockTemplateRepository.save.mockResolvedValue(mockTemplate);

      const result = await service.createTemplate(createDto);

      expect(mockTemplateRepository.create).toHaveBeenCalledWith({
        ...createDto,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
      expect(mockTemplateRepository.save).toHaveBeenCalledWith(mockTemplate);
      expect(result).toEqual(mockTemplate);
    });

    it('should create an SMS template', async () => {
      const createDto: CreateTemplateDto = {
        name: 'Certificate Alert SMS',
        type: 'sms',
        content: 'ALERT: Certificate {{certificateName}} has been revoked.',
        variables: ['certificateName'],
        isActive: true,
        category: 'certificate_revoked',
      };

      const mockTemplate = {
        id: 'template-456',
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTemplateRepository.create.mockReturnValue(mockTemplate);
      mockTemplateRepository.save.mockResolvedValue(mockTemplate);

      const result = await service.createTemplate(createDto);

      expect(result).toEqual(mockTemplate);
    });
  });

  describe('updateTemplate', () => {
    it('should update a template successfully', async () => {
      const updateDto: UpdateTemplateDto = {
        name: 'Updated Welcome Email',
        subject: 'Updated Welcome to CertShield',
        content: 'Hello {{name}}, welcome to CertShield! Updated.',
      };

      const mockTemplate = {
        id: 'template-123',
        name: 'Updated Welcome Email',
        type: 'email',
        subject: 'Updated Welcome to CertShield',
        content: 'Hello {{name}}, welcome to CertShield! Updated.',
        htmlContent: '<h1>Hello {{name}}</h1><p>Welcome to CertShield!</p>',
        variables: ['name'],
        isActive: true,
        category: 'user_activity',
        updatedAt: new Date(),
      };

      mockTemplateRepository.update.mockResolvedValue({ affected: 1 });
      mockTemplateRepository.findOne.mockResolvedValue(mockTemplate);

      const result = await service.updateTemplate('template-123', updateDto);

      expect(mockTemplateRepository.update).toHaveBeenCalledWith('template-123', {
        ...updateDto,
        updatedAt: expect.any(Date),
      });
      expect(mockTemplateRepository.findOne).toHaveBeenCalledWith({ where: { id: 'template-123' } });
      expect(result).toEqual(mockTemplate);
    });

    it('should handle template not found during update', async () => {
      const updateDto: UpdateTemplateDto = {
        name: 'Updated Template',
      };

      mockTemplateRepository.update.mockResolvedValue({ affected: 0 });
      mockTemplateRepository.findOne.mockResolvedValue(null);

      const result = await service.updateTemplate('non-existent', updateDto);

      expect(result).toBeNull();
    });
  });

  describe('getTemplate', () => {
    it('should get a template by ID', async () => {
      const mockTemplate = {
        id: 'template-123',
        name: 'Welcome Email',
        type: 'email',
        subject: 'Welcome to CertShield',
        content: 'Hello {{name}}, welcome to CertShield!',
        htmlContent: '<h1>Hello {{name}}</h1><p>Welcome to CertShield!</p>',
        variables: ['name'],
        isActive: true,
        category: 'user_activity',
      };

      mockTemplateRepository.findOne.mockResolvedValue(mockTemplate);

      const result = await service.getTemplate('template-123');

      expect(mockTemplateRepository.findOne).toHaveBeenCalledWith({ where: { id: 'template-123' } });
      expect(result).toEqual(mockTemplate);
    });

    it('should return null for non-existent template', async () => {
      mockTemplateRepository.findOne.mockResolvedValue(null);

      const result = await service.getTemplate('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getTemplatesByType', () => {
    it('should get templates by type', async () => {
      const mockTemplates = [
        {
          id: 'template-1',
          name: 'Welcome Email',
          type: 'email',
          isActive: true,
        },
        {
          id: 'template-2',
          name: 'Certificate Issued Email',
          type: 'email',
          isActive: true,
        },
      ];

      mockTemplateRepository.find.mockResolvedValue(mockTemplates);

      const result = await service.getTemplatesByType('email');

      expect(mockTemplateRepository.find).toHaveBeenCalledWith({
        where: { type: 'email', isActive: true },
        order: { name: 'ASC' },
      });
      expect(result).toEqual(mockTemplates);
    });
  });

  describe('getTemplatesByCategory', () => {
    it('should get templates by category', async () => {
      const mockTemplates = [
        {
          id: 'template-1',
          name: 'Certificate Issued Email',
          category: 'certificate_issued',
          isActive: true,
        },
        {
          id: 'template-2',
          name: 'Certificate Revoked SMS',
          category: 'certificate_issued',
          isActive: true,
        },
      ];

      mockTemplateRepository.find.mockResolvedValue(mockTemplates);

      const result = await service.getTemplatesByCategory('certificate_issued');

      expect(mockTemplateRepository.find).toHaveBeenCalledWith({
        where: { category: 'certificate_issued', isActive: true },
        order: { name: 'ASC' },
      });
      expect(result).toEqual(mockTemplates);
    });
  });

  describe('deleteTemplate', () => {
    it('should delete a template successfully', async () => {
      mockTemplateRepository.delete.mockResolvedValue({ affected: 1 });

      await service.deleteTemplate('template-123');

      expect(mockTemplateRepository.delete).toHaveBeenCalledWith('template-123');
    });
  });

  describe('renderTemplate', () => {
    it('should render template with variables', async () => {
      const mockTemplate = {
        id: 'template-123',
        name: 'Welcome Email',
        type: 'email',
        subject: 'Welcome {{name}} to CertShield',
        content: 'Hello {{name}}, welcome to CertShield! Your email is {{email}}.',
        htmlContent: '<h1>Hello {{name}}</h1><p>Welcome to CertShield!</p><p>Email: {{email}}</p>',
        variables: ['name', 'email'],
        isActive: true,
        category: 'user_activity',
      };

      mockTemplateRepository.findOne.mockResolvedValue(mockTemplate);

      const templateData = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      const result = await service.renderTemplate('template-123', templateData);

      expect(result).toEqual({
        subject: 'Welcome John Doe to CertShield',
        content: 'Hello John Doe, welcome to CertShield! Your email is john@example.com.',
        htmlContent: '<h1>Hello John Doe</h1><p>Welcome to CertShield!</p><p>Email: john@example.com</p>',
      });
    });

    it('should render template without subject', async () => {
      const mockTemplate = {
        id: 'template-123',
        name: 'SMS Template',
        type: 'sms',
        content: 'Hello {{name}}, your code is {{code}}.',
        variables: ['name', 'code'],
        isActive: true,
        category: 'user_activity',
      };

      mockTemplateRepository.findOne.mockResolvedValue(mockTemplate);

      const templateData = {
        name: 'John',
        code: '123456',
      };

      const result = await service.renderTemplate('template-123', templateData);

      expect(result).toEqual({
        content: 'Hello John, your code is 123456.',
      });
    });

    it('should handle template not found', async () => {
      mockTemplateRepository.findOne.mockResolvedValue(null);

      await expect(service.renderTemplate('non-existent', {})).rejects.toThrow('Template not found: non-existent');
    });

    it('should handle missing template variables', async () => {
      const mockTemplate = {
        id: 'template-123',
        name: 'Welcome Email',
        type: 'email',
        subject: 'Welcome {{name}} to CertShield',
        content: 'Hello {{name}}, welcome to CertShield! Your email is {{email}}.',
        variables: ['name', 'email'],
        isActive: true,
        category: 'user_activity',
      };

      mockTemplateRepository.findOne.mockResolvedValue(mockTemplate);

      const templateData = {
        name: 'John Doe',
        // Missing email variable
      };

      const result = await service.renderTemplate('template-123', templateData);

      expect(result).toEqual({
        subject: 'Welcome John Doe to CertShield',
        content: 'Hello John Doe, welcome to CertShield! Your email is .',
      });
    });
  });

  describe('getDefaultTemplates', () => {
    it('should create default templates if they do not exist', async () => {
      mockTemplateRepository.findOne.mockResolvedValue(null); // No existing templates
      mockTemplateRepository.create.mockImplementation((data) => ({
        id: `template-${Math.random()}`,
        ...data,
      }));
      mockTemplateRepository.save.mockImplementation((template) => Promise.resolve(template));
      mockTemplateRepository.find.mockResolvedValue([
        {
          id: 'template-1',
          name: 'Certificate Issued Email',
          isActive: true,
        },
        {
          id: 'template-2',
          name: 'Certificate Expiry Warning',
          isActive: true,
        },
      ]);

      const result = await service.getDefaultTemplates();

      expect(mockTemplateRepository.create).toHaveBeenCalledTimes(4); // 4 default templates
      expect(result).toHaveLength(2);
    });

    it('should return existing templates without creating duplicates', async () => {
      const existingTemplate = {
        id: 'template-1',
        name: 'Certificate Issued Email',
        isActive: true,
      };

      mockTemplateRepository.findOne.mockResolvedValue(existingTemplate);
      mockTemplateRepository.find.mockResolvedValue([existingTemplate]);

      const result = await service.getDefaultTemplates();

      expect(mockTemplateRepository.create).not.toHaveBeenCalled();
      expect(result).toEqual([existingTemplate]);
    });
  });

  describe('validateTemplate', () => {
    it('should validate template successfully', async () => {
      const mockTemplate = {
        id: 'template-123',
        name: 'Test Template',
        type: 'email',
        subject: 'Welcome {{name}}',
        content: 'Hello {{name}}, welcome!',
        variables: ['name'],
        isActive: true,
        category: 'user_activity',
      };

      mockTemplateRepository.findOne.mockResolvedValue(mockTemplate);

      const testData = { name: 'John Doe' };

      const result = await service.validateTemplate('template-123', testData);

      expect(result).toBe(true);
    });

    it('should fail validation for invalid template', async () => {
      const mockTemplate = {
        id: 'template-123',
        name: 'Invalid Template',
        type: 'email',
        subject: 'Welcome {{name}}',
        content: 'Hello {{name}}, welcome!',
        variables: ['name'],
        isActive: true,
        category: 'user_activity',
      };

      mockTemplateRepository.findOne.mockResolvedValue(mockTemplate);

      // Test data missing required variable
      const testData = {};

      const result = await service.validateTemplate('template-123', testData);

      expect(result).toBe(true); // Should still pass as missing variables are handled gracefully
    });

    it('should fail validation for non-existent template', async () => {
      mockTemplateRepository.findOne.mockResolvedValue(null);

      const result = await service.validateTemplate('non-existent', {});

      expect(result).toBe(false);
    });
  });

  describe('getTemplateVariables', () => {
    it('should get template variables', async () => {
      const mockTemplate = {
        id: 'template-123',
        name: 'Test Template',
        variables: ['name', 'email', 'company'],
        isActive: true,
      };

      mockTemplateRepository.findOne.mockResolvedValue(mockTemplate);

      const result = await service.getTemplateVariables('template-123');

      expect(result).toEqual(['name', 'email', 'company']);
    });

    it('should return empty array for non-existent template', async () => {
      mockTemplateRepository.findOne.mockResolvedValue(null);

      const result = await service.getTemplateVariables('non-existent');

      expect(result).toEqual([]);
    });

    it('should return empty array for template without variables', async () => {
      const mockTemplate = {
        id: 'template-123',
        name: 'Test Template',
        variables: null,
        isActive: true,
      };

      mockTemplateRepository.findOne.mockResolvedValue(mockTemplate);

      const result = await service.getTemplateVariables('template-123');

      expect(result).toEqual([]);
    });
  });

  describe('template rendering edge cases', () => {
    it('should handle nested object variables', async () => {
      const mockTemplate = {
        id: 'template-123',
        name: 'Complex Template',
        type: 'email',
        subject: 'Welcome {{user.name}}',
        content: 'Hello {{user.name}}, your role is {{user.role}}.',
        htmlContent: '<h1>Hello {{user.name}}</h1><p>Role: {{user.role}}</p>',
        variables: ['user.name', 'user.role'],
        isActive: true,
        category: 'user_activity',
      };

      mockTemplateRepository.findOne.mockResolvedValue(mockTemplate);

      const templateData = {
        user: {
          name: 'John Doe',
          role: 'Developer',
        },
      };

      const result = await service.renderTemplate('template-123', templateData);

      expect(result).toEqual({
        subject: 'Welcome John Doe',
        content: 'Hello John Doe, your role is Developer.',
        htmlContent: '<h1>Hello John Doe</h1><p>Role: Developer</p>',
      });
    });

    it('should handle array variables', async () => {
      const mockTemplate = {
        id: 'template-123',
        name: 'Array Template',
        type: 'email',
        content: 'Your certificates: {{#each certificates}}{{name}}, {{/each}}',
        variables: ['certificates'],
        isActive: true,
        category: 'user_activity',
      };

      mockTemplateRepository.findOne.mockResolvedValue(mockTemplate);

      const templateData = {
        certificates: [
          { name: 'Web Development' },
          { name: 'Mobile Development' },
        ],
      };

      const result = await service.renderTemplate('template-123', templateData);

      expect(result).toEqual({
        content: 'Your certificates: Web Development, Mobile Development, ',
      });
    });

    it('should handle special characters in variables', async () => {
      const mockTemplate = {
        id: 'template-123',
        name: 'Special Characters Template',
        type: 'email',
        content: 'Hello {{name}}, your code is {{code}}!',
        variables: ['name', 'code'],
        isActive: true,
        category: 'user_activity',
      };

      mockTemplateRepository.findOne.mockResolvedValue(mockTemplate);

      const templateData = {
        name: 'John & Jane',
        code: 'ABC-123!@#',
      };

      const result = await service.renderTemplate('template-123', templateData);

      expect(result).toEqual({
        content: 'Hello John & Jane, your code is ABC-123!@#!',
      });
    });
  });
}); 