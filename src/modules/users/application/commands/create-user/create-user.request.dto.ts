import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserRequestDto {
  @ApiProperty({ example: 'test@example.com', description: 'User email' })
  @IsEmail()
  readonly email: string;

  @ApiProperty({ example: 'John Doe', description: 'User name' })
  @IsString()
  @MinLength(2)
  readonly name: string;

  @ApiProperty({ example: 'password123', description: 'User password' })
  @IsString()
  @MinLength(8)
  readonly password: string;
}
