import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';

export const createTestingModule = async (modules: any[], providers: any[] = []) => {
  return await Test.createTestingModule({
    imports: [
      TypeOrmModule.forRoot({
        type: 'sqlite',
        database: ':memory:',
        entities: ['src/**/*.orm-entity.ts'],
        synchronize: true,
        logging: false,
      }),
      ...modules,
    ],
    providers: [...providers],
  }).compile();
};

export const mockRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  remove: jest.fn(),
  count: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getOne: jest.fn(),
    getManyAndCount: jest.fn(),
  }),
};

export const resetMocks = () => {
  Object.values(mockRepository).forEach((mockFn: any) => {
    if (typeof mockFn === 'function' && mockFn.mockReset) {
      mockFn.mockReset();
    }
  });
};

beforeEach(() => {
  resetMocks();
});