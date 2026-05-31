import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, In } from 'typeorm';
import { RoleOrmEntity } from '../../infrastructure/database/role.entity.orm';
import { PermissionOrmEntity } from '../../infrastructure/database/permission.entity.orm';
import { AssignPermissionsDto } from '../dtos/assign-permissions.dto';
import { RemovePermissionsDto } from '../dtos/remove-permissions.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(RoleOrmEntity)
    private readonly roleRepo: Repository<RoleOrmEntity>,
    @InjectRepository(PermissionOrmEntity)
    private readonly permissionRepo: Repository<PermissionOrmEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async findAllRoles() {
    return this.roleRepo.find({
      relations: ['permissions', 'permissions.module'],
      order: { id: 'ASC' },
    });
  }

  async findRoleById(id: number) {
    const role = await this.roleRepo.findOne({
      where: { id },
      relations: ['permissions', 'permissions.module'],
    });
    if (!role) throw new NotFoundException('Rol no encontrado');
    return role;
  }

  async getRolePermissions(roleId: number) {
    const role = await this.findRoleById(roleId);
    return role.permissions;
  }

  async assignPermissionsToRole(roleId: number, dto: AssignPermissionsDto) {
    const role = await this.findRoleById(roleId);

    if (dto.permissionIds.length === 0) return role;

    const permissionsToAdd = await this.permissionRepo.find({
      where: { id: In(dto.permissionIds) },
    });

    if (permissionsToAdd.length !== dto.permissionIds.length) {
      throw new BadRequestException(
        'Algunos permisos proporcionados no existen',
      );
    }

    // Unir los actuales con los nuevos (evitar duplicados por id)
    const currentPermissionIds = role.permissions.map((p) => p.id);
    const newPermissions = permissionsToAdd.filter(
      (p) => !currentPermissionIds.includes(p.id),
    );

    role.permissions = [...role.permissions, ...newPermissions];
    await this.roleRepo.save(role);

    return this.findRoleById(roleId);
  }

  async setRolePermissions(roleId: number, dto: AssignPermissionsDto) {
    const role = await this.findRoleById(roleId);

    let newPermissions: PermissionOrmEntity[] = [];
    if (dto.permissionIds.length > 0) {
      newPermissions = await this.permissionRepo.find({
        where: { id: In(dto.permissionIds) },
      });

      if (newPermissions.length !== dto.permissionIds.length) {
        throw new BadRequestException(
          'Algunos permisos proporcionados no existen',
        );
      }
    }

    role.permissions = newPermissions;
    await this.roleRepo.save(role);

    return this.findRoleById(roleId);
  }

  async removePermissionsFromRole(roleId: number, dto: RemovePermissionsDto) {
    const role = await this.findRoleById(roleId);

    if (dto.permissionIds.length === 0) return role;

    role.permissions = role.permissions.filter(
      (p) => !dto.permissionIds.includes(p.id),
    );
    await this.roleRepo.save(role);

    return this.findRoleById(roleId);
  }
}
