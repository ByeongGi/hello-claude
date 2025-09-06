import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '@/application/users/dto/user-response.dto';

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT access token' })
  accessToken: string;

  @ApiProperty({ description: 'JWT refresh token' })
  refreshToken: string;

  @ApiProperty({ description: 'User information', type: UserResponseDto })
  user: UserResponseDto;
}
