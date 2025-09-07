import { AppService } from '@/app.service';

describe('AppService', () => {
  let appService: AppService;

  beforeEach(() => {
    appService = new AppService();
  });

  describe('getHello', () => {
    it('should return "Hello World!" message', () => {
      // Act
      const result = appService.getHello();

      // Assert
      expect(result).toBe('Hello World!');
    });

    it('should always return the same message', () => {
      // Act
      const result1 = appService.getHello();
      const result2 = appService.getHello();
      const result3 = appService.getHello();

      // Assert
      expect(result1).toBe('Hello World!');
      expect(result2).toBe('Hello World!');
      expect(result3).toBe('Hello World!');
      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });

    it('should return a string', () => {
      // Act
      const result = appService.getHello();

      // Assert
      expect(typeof result).toBe('string');
    });
  });
});