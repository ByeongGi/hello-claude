import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  const mockAppService = {
    getHello: jest.fn(),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: mockAppService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getHello', () => {
    it('should return hello message from service', () => {
      // Arrange
      const expectedMessage = 'Hello World!';
      mockAppService.getHello.mockReturnValue(expectedMessage);

      // Act
      const result = appController.getHello();

      // Assert
      expect(appService.getHello).toHaveBeenCalledTimes(1);
      expect(result).toBe(expectedMessage);
    });

    it('should handle service returning different messages', () => {
      // Arrange
      const customMessage = 'Custom Hello Message';
      mockAppService.getHello.mockReturnValue(customMessage);

      // Act
      const result = appController.getHello();

      // Assert
      expect(result).toBe(customMessage);
    });
  });
});