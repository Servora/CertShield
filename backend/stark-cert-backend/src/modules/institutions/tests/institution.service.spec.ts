// import { Test, TestingModule } from '@nestjs/testing';
// import { InstitutionService } from '../services/institution.service';
// import { getRepositoryToken } from '@nestjs/typeorm';
// import { Institution } from '../entities/institution.entity';
// import { Repository } from 'typeorm';

// const mockInstitution = {
//   id: 1,
//   name: 'Test University',
//   email: 'contact@test.edu',
//   country: 'NG',
//   verified: false,
// };

// describe('InstitutionService', () => {
//   let service: InstitutionService;
//   let repo: Repository<Institution>;

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         InstitutionService,
//         {
//           provide: getRepositoryToken(Institution),
//           useClass: Repository,
//         },
//       ],
//     }).compile();

//     service = module.get<InstitutionService>(InstitutionService);
//     repo = module.get<Repository<Institution>>(getRepositoryToken(Institution));
//   });

//   it('should be defined', () => {
//     expect(service).toBeDefined();
//   });

//   it('should create an institution', async () => {
//     jest.spyOn(repo, 'save').mockResolvedValue(mockInstitution as Institution);
//     const result = await service.createInstitution(mockInstitution);
//     expect(result).toEqual(mockInstitution);
//   });

//   it('should return institution by ID', async () => {
//     jest.spyOn(repo, 'findOneBy').mockResolvedValue(mockInstitution as Institution);
//     const result = await service.getInstitutionById(1);
//     expect(result.name).toEqual('Test University');
//   });
// });
