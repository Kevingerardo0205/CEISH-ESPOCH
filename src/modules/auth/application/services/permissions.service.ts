import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { IPermissionsRepository } from '../../domain/ports/permissions.repository.port';
import { IModulesRepository } from '../../domain/ports/modules.repository.port';
import { CreatePermissionDto } from '../dtos/create-permission.dto';
import { UpdatePermissionDto } from '../dtos/update-permission.dto';
import { CreateModuleDto } from '../dtos/create-module.dto';
import { UpdateModuleDto } from '../dtos/update-module.dto';

@Injectable()
export class PermissionsService {
  constructor(
    private readonly permissionsRepository: IPermissionsRepository,
    private readonly modulesRepository: IModulesRepository,
  ) {}

  // --- MODULES ---
  async findAllModules() {
    return this.modulesRepository.findAll();
  }

  async findModuleById(id: number) {
    const module = await this.modulesRepository.findById(id);
    if (!module) throw new NotFoundException('Módulo no encontrado');
    return module;
  }

  async createModule(dto: CreateModuleDto) {
    const existing = await this.modulesRepository.findByCode(dto.code);
    if (existing) {
      throw new BadRequestException(
        `El código de módulo '${dto.code}' ya existe`,
      );
    }
    return this.modulesRepository.save(dto);
  }

  async updateModule(id: number, dto: UpdateModuleDto) {
    const module = await this.modulesRepository.findById(id);
    if (!module) throw new NotFoundException('Módulo no encontrado');

    await this.modulesRepository.update(id, dto);
    return this.modulesRepository.findById(id);
  }

  async deleteModule(id: number) {
    const module = await this.modulesRepository.findById(id);
    if (!module) throw new NotFoundException('Módulo no encontrado');
    await this.modulesRepository.softDelete(id);
  }

  // --- PERMISSIONS ---
  async findAllPermissions() {
    return this.permissionsRepository.findAll();
  }

  async findPermissionById(id: number) {
    const permission = await this.permissionsRepository.findById(id);
    if (!permission) throw new NotFoundException('Permiso no encontrado');
    return permission;
  }

  async findPermissionsByModule(moduleId: number) {
    const module = await this.modulesRepository.findById(moduleId);
    if (!module) throw new NotFoundException('Módulo no encontrado');
    return this.permissionsRepository.findByModuleId(moduleId);
  }

  async createPermission(dto: CreatePermissionDto) {
    const existing = await this.permissionsRepository.findByCode(dto.code);
    if (existing) {
      throw new BadRequestException(
        `El código de permiso '${dto.code}' ya existe`,
      );
    }

    if (dto.moduleId) {
      const module = await this.modulesRepository.findById(dto.moduleId);
      if (!module) throw new NotFoundException('Módulo no encontrado');
    }

    return this.permissionsRepository.save(dto);
  }

  async updatePermission(id: number, dto: UpdatePermissionDto) {
    const permission = await this.permissionsRepository.findById(id);
    if (!permission) throw new NotFoundException('Permiso no encontrado');

    if (dto.moduleId) {
      const module = await this.modulesRepository.findById(dto.moduleId);
      if (!module) throw new NotFoundException('Módulo no encontrado');
    }

    await this.permissionsRepository.update(id, dto);
    return this.permissionsRepository.findById(id);
  }

  async deletePermission(id: number) {
    const permission = await this.permissionsRepository.findById(id);
    if (!permission) throw new NotFoundException('Permiso no encontrado');
    await this.permissionsRepository.softDelete(id);
  }
}
