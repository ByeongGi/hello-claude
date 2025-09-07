import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from '@/application/auth/auth.service';
import { LoginDto } from '@/application/auth/dto/login.dto';
import { RefreshTokenDto } from '@/application/auth/dto/refresh-token.dto';
import { AuthResponseDto } from '@/application/auth/dto/auth-response.dto';
import { UserResponseDto } from '@/application/users/dto/user-response.dto';
import { UserRole } from '@/domain/users/user.entity';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockUser: UserResponseDto = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    password: 'hashedPassword',
    role: UserRole.USER,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAuthResponse: AuthResponseDto = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    user: mockUser,
  };

  const mockAuthService = {
    login: jest.fn(),
    refreshToken: jest.fn(),
    validateUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'john@example.com',
      password: 'password123',
    };

    it('should login successfully with valid credentials', async () => {
      authService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(mockAuthResponse);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user).toEqual(mockUser);
    });

    it('should throw UnauthorizedException with invalid credentials', async () => {
      authService.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });

    it('should throw UnauthorizedException for deactivated account', async () => {
      authService.login.mockRejectedValue(
        new UnauthorizedException('Account is deactivated'),
      );

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refresh', () => {
    const refreshTokenDto: RefreshTokenDto = {
      refreshToken: 'valid-refresh-token',
    };

    const mockRefreshResponse = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    };

    it('should refresh tokens successfully with valid refresh token', async () => {
      authService.refreshToken.mockResolvedValue(mockRefreshResponse);

      const result = await controller.refresh(refreshTokenDto);

      expect(authService.refreshToken).toHaveBeenCalledWith(
        refreshTokenDto.refreshToken,
      );
      expect(result).toEqual(mockRefreshResponse);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw UnauthorizedException with invalid refresh token', async () => {
      authService.refreshToken.mockRejectedValue(
        new UnauthorizedException('Invalid refresh token'),
      );

      await expect(controller.refresh(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException with expired refresh token', async () => {
      authService.refreshToken.mockRejectedValue(
        new UnauthorizedException('Invalid refresh token'),
      );

      await expect(controller.refresh(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getProfile', () => {
    it('should return current user profile', () => {
      const result = controller.getProfile(mockUser);

      expect(result).toEqual(mockUser);
      expect(result.id).toBe(mockUser.id);
      expect(result.email).toBe(mockUser.email);
      expect(result.name).toBe(mockUser.name);
    });

    it('should handle undefined user', () => {
      const result = controller.getProfile(undefined as any);

      expect(result).toBeUndefined();
    });

    it('should return complete user profile', () => {
      const result = controller.getProfile(mockUser);

      expect(result).toEqual(mockUser);
      expect(result).toEqual(
        expect.objectContaining({
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role,
          isActive: mockUser.isActive,
        }),
      );
    });
  });
});
