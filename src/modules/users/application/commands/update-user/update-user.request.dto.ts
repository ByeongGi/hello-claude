import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class UpdateUserRequestDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'User name',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  readonly name?: string;

  @ApiProperty({
    example: 'test@example.com',
    description: 'User email',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  readonly email?: string;

  @ApiProperty({
    example: 'newPassword123',
    description: 'New user password',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  readonly password?: string;
}
