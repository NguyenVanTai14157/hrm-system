import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin' })
  @IsString() @Matches(/^[a-zA-Z0-9._-]{3,50}$/)
  username!: string;

  @ApiProperty({ format: 'password' })
  @IsString() @MinLength(1) @MaxLength(72)
  password!: string;

  @ApiProperty({ required: false, default: false })
  @IsOptional() @IsBoolean()
  rememberMe?: boolean;
}
export class ChangePasswordDto {
  @ApiProperty({ format: 'password' })
  @IsString() @MinLength(1) @MaxLength(72)
  currentPassword!: string;

  @ApiProperty({ format: 'password', minLength: 10, maxLength: 72 })
  @IsString() @MinLength(10) @MaxLength(72)
  newPassword!: string;
}
