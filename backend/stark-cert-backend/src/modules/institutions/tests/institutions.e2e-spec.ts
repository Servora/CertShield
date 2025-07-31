import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../../app.module';

describe('InstitutionController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/institutions (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/institutions')
      .send({
        name: 'Test Institute',
        email: 'admin@test.edu',
        country: 'NG',
      })
      .expect(201);

    expect(res.body.name).toBe('Test Institute');
    expect(res.body.email).toBe('admin@test.edu');
  });

  it('/institutions/:id (GET)', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/institutions')
      .send({
        name: 'Query Institute',
        email: 'query@test.edu',
        country: 'NG',
      });

    const res = await request(app.getHttpServer())
      .get(`/institutions/${createRes.body.id}`)
      .expect(200);

    expect(res.body.email).toBe('query@test.edu');
  });
});
