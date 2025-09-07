import { ApiProperty } from '@nestjs/swagger';

export class IdResponse {
  @ApiProperty({
    description: 'ID of the created resource',
    example: 'cl9q0k4d10000a0b1c2d3e4f5',
  })
  id: string;

  constructor(id: string) {
    this.id = id;
  }
}
