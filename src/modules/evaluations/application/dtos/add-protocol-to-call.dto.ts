import { IsInt, IsNotEmpty } from 'class-validator';

export class AddProtocolToCallDto {
  @IsInt()
  @IsNotEmpty()
  protocolId!: number;

  @IsInt()
  @IsNotEmpty()
  order!: number;
}
