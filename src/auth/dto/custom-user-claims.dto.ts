import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CustomUserClaimsDto {
  @ApiProperty({ description: "The user's Firebase id" })
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'The variable claim options' })
  @IsNotEmpty()
  claims: Object;
}
