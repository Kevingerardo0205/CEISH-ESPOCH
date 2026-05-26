import { IsArray, IsNumber } from 'class-validator';

export class RemovePermissionsDto {
  @IsArray()
  @IsNumber({}, { each: true })
  permissionIds: number[];
}
