import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, In, EntityManager } from 'typeorm';
import { Request } from 'express';
import { RoleOrmEntity } from '../../infrastructure/database/role.entity.orm';
import { PermissionOrmEntity } from '../../infrastructure/database/permission.entity.orm';
import { AssignPermissionsDto } from '../dtos/assign-permissions.dto';
import { RemovePermissionsDto } from '../dtos/remove-permissions.dto';
import { CreateRoleDto } from '../dtos/create-role.dto';
import { UpdateRoleDto } from '../dtos/update-role.dto';
import { OFFICIAL_ROLE_PRESETS } from '../../domain/constants/role-presets.constant';
import { RoleCode } from '../../domain/enums/role.enum';

interface EnrichedRequest extends Request {
  auditDetails?: unknown;
}

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

  async findRoleById(id: number, manager?: EntityManager) {
    const repo = manager ? manager.getRepository(RoleOrmEntity) : this.roleRepo;
    const role = await repo.findOne({
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

  async assignPermissionsToRole(
    roleId: number,
    dto: AssignPermissionsDto,
    req?: Request,
  ) {
    const uniqueIds = Array.from(new Set(dto.permissionIds));
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const role = await this.findRoleById(roleId, queryRunner.manager);
      const previousPermissions = role.permissions.map((p) => p.code);

      if (uniqueIds.length === 0) {
        await queryRunner.commitTransaction();
        return role;
      }

      const permissionsToAdd = await queryRunner.manager.find(
        PermissionOrmEntity,
        {
          where: { id: In(uniqueIds) },
          select: ['id', 'code'],
        },
      );

      if (permissionsToAdd.length !== uniqueIds.length) {
        throw new BadRequestException(
          'Algunos permisos proporcionados no existen',
        );
      }

      const currentPermissionIds = role.permissions.map((p) => p.id);
      const newPermissions = permissionsToAdd.filter(
        (p) => !currentPermissionIds.includes(p.id),
      );

      const addedPermissionIds = newPermissions.map((p) => p.id);
      const addedPermissionCodes = newPermissions.map((p) => p.code);

      if (addedPermissionIds.length > 0) {
        await queryRunner.manager
          .createQueryBuilder()
          .relation(RoleOrmEntity, 'permissions')
          .of(roleId)
          .add(addedPermissionIds);
      }

      if (req) {
        (req as EnrichedRequest).auditDetails = {
          roleId,
          roleCode: role.code,
          actionType: 'ASSIGN',
          previousPermissions,
          addedPermissions: addedPermissionCodes,
          currentPermissions: [...previousPermissions, ...addedPermissionCodes],
        };
      }

      await queryRunner.commitTransaction();
      return this.findRoleById(roleId);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async setRolePermissions(
    roleId: number,
    dto: AssignPermissionsDto,
    req?: Request,
  ) {
    const uniqueIds = Array.from(new Set(dto.permissionIds));
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const role = await this.findRoleById(roleId, queryRunner.manager);
      const previousPermissions = role.permissions.map((p) => p.code);

      let newPermissions: PermissionOrmEntity[] = [];
      if (uniqueIds.length > 0) {
        newPermissions = await queryRunner.manager.find(PermissionOrmEntity, {
          where: { id: In(uniqueIds) },
          select: ['id', 'code'],
        });

        if (newPermissions.length !== uniqueIds.length) {
          throw new BadRequestException(
            'Algunos permisos proporcionados no existen',
          );
        }
      }

      const currentPermissionCodes = newPermissions.map((p) => p.code);
      const newPermissionIds = newPermissions.map((p) => p.id);

      await queryRunner.manager
        .createQueryBuilder()
        .relation(RoleOrmEntity, 'permissions')
        .of(roleId)
        .set(newPermissionIds);

      if (req) {
        (req as EnrichedRequest).auditDetails = {
          roleId,
          roleCode: role.code,
          actionType: 'SET',
          previousPermissions,
          currentPermissions: currentPermissionCodes,
        };
      }

      await queryRunner.commitTransaction();
      return this.findRoleById(roleId);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async removePermissionsFromRole(
    roleId: number,
    dto: RemovePermissionsDto,
    req?: Request,
  ) {
    const uniqueIds = Array.from(new Set(dto.permissionIds));
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const role = await this.findRoleById(roleId, queryRunner.manager);
      const previousPermissions = role.permissions.map((p) => p.code);

      if (uniqueIds.length === 0) {
        await queryRunner.commitTransaction();
        return role;
      }

      const permissionsToRemove = role.permissions.filter((p) =>
        uniqueIds.includes(p.id),
      );
      const removedPermissionIds = permissionsToRemove.map((p) => p.id);
      const removedPermissionCodes = permissionsToRemove.map((p) => p.code);

      const currentPermissions = role.permissions
        .filter((p) => !uniqueIds.includes(p.id))
        .map((p) => p.code);

      if (removedPermissionIds.length > 0) {
        await queryRunner.manager
          .createQueryBuilder()
          .relation(RoleOrmEntity, 'permissions')
          .of(roleId)
          .remove(removedPermissionIds);
      }

      if (req) {
        (req as EnrichedRequest).auditDetails = {
          roleId,
          roleCode: role.code,
          actionType: 'REMOVE',
          previousPermissions,
          removedPermissions: removedPermissionCodes,
          currentPermissions,
        };
      }

      await queryRunner.commitTransaction();
      return this.findRoleById(roleId);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async createRole(dto: CreateRoleDto) {
    const normalizedCode = dto.code.toUpperCase().replace(/\s+/g, '_');
    const existing = await this.roleRepo.findOne({
      where: { code: normalizedCode },
    });

    if (existing) {
      throw new BadRequestException('El código del rol ya existe');
    }

    const role = this.roleRepo.create({
      code: normalizedCode,
      name: dto.name,
      description: dto.description,
      isActive: true,
    });

    return this.roleRepo.save(role);
  }

  async updateRole(id: number, dto: UpdateRoleDto) {
    const role = await this.findRoleById(id);

    if (dto.name !== undefined) role.name = dto.name;
    if (dto.description !== undefined) role.description = dto.description;
    if (dto.isActive !== undefined) role.isActive = dto.isActive;

    return this.roleRepo.save(role);
  }

  async deleteRole(id: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const role = await this.findRoleById(id, queryRunner.manager);

      const userCountRaw = await queryRunner.manager.query<{ count: string }>(
        `
        SELECT COUNT(*) as count 
        FROM catalogos.usuarios_roles 
        WHERE rol_id = $1
      `,
        [id],
      );

      const userCount = parseInt(userCountRaw[0]?.count || '0', 10);
      if (userCount > 0) {
        throw new BadRequestException(
          'No se puede eliminar el rol porque tiene usuarios asignados',
        );
      }

      role.isActive = false;
      await queryRunner.manager.save(RoleOrmEntity, role);

      await queryRunner.commitTransaction();
      return { message: 'Rol desactivado exitosamente' };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  getRolePresets() {
    return OFFICIAL_ROLE_PRESETS;
  }

  async resetRoleToPreset(roleId: number, req?: Request) {
    const role = await this.findRoleById(roleId);
    const roleCode = role.code.toUpperCase() as RoleCode;
    const presetPermissions = OFFICIAL_ROLE_PRESETS[roleCode];

    if (!presetPermissions) {
      throw new BadRequestException(
        `No existe una plantilla oficial predefinida para el rol ${role.code}`,
      );
    }

    const permissionsInDb = await this.permissionRepo.find({
      where: { code: In(presetPermissions) },
    });
    const permissionIds = permissionsInDb.map((p) => p.id);

    return this.setRolePermissions(roleId, { permissionIds }, req);
  }

  async getRoleComplianceStatus(roleId: number) {
    const role = await this.findRoleById(roleId);
    const roleCode = role.code.toUpperCase() as RoleCode;
    const presetPermissions = (OFFICIAL_ROLE_PRESETS[roleCode] || []).map((p) =>
      p.toString(),
    );

    const currentPermissionCodes = role.permissions.map((p) => p.code);

    const missingPermissions = presetPermissions.filter(
      (code) => !currentPermissionCodes.includes(code),
    );
    const extraPermissions = currentPermissionCodes.filter(
      (code) => !presetPermissions.includes(code),
    );

    const isCompliant =
      missingPermissions.length === 0 && extraPermissions.length === 0;

    return {
      roleId: role.id,
      roleCode: role.code,
      status: isCompliant ? 'STANDARD' : 'CUSTOM',
      isCompliant,
      missingPermissions,
      extraPermissions,
      currentPermissionCount: currentPermissionCodes.length,
      expectedPermissionCount: presetPermissions.length,
    };
  }
}
