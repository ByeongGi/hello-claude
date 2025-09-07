import { ApiProperty } from '@nestjs/swagger';

export class IdResponse {
  @ApiProperty({ description: 'ID of the created resource' })
  id: string;

  constructor(id: string) {
    this.id = id;
  }
}
