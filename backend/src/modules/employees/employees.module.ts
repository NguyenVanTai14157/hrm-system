import { Module, Controller, Get, Post, Patch, Delete, Body, Query, Param, Req, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthModule } from '../auth/auth.module';
import { RequirePermissions } from '../auth/auth.decorators';
import type { AuthRequest } from '../auth/auth.types';
import { EmployeesService } from './employees.service';
import { UsersService } from '../users/users.service';
import { CreateEmployeeDto, UpdateEmployeeDto, EmployeeQuery, CatalogDto, UpdateCatalogDto } from './employees.dto';
@ApiTags('Employees') @ApiBearerAuth() @Controller('employees') @RequirePermissions('employee.view')
class EmployeesController {
  constructor(private readonly service: EmployeesService, private readonly usersService: UsersService) {}
  @Get('stats') stats() { return this.service.stats(); }
  @Get('next-code') nextCode() { return this.service.getNextCode(); }
  @Get() list(@Query() query:EmployeeQuery) { return this.service.list(query); }
  @Get(':id') detail(@Param('id',ParseUUIDPipe) id:string) { return this.service.detail(id); }
  @Get(':id/history') history(@Param('id',ParseUUIDPipe) id:string,@Query() query:EmployeeQuery) { return this.service.history(id,query); }
  @Post() @RequirePermissions('employee.view','employee.create') create(@Body() dto:CreateEmployeeDto,@Req() req:AuthRequest) { return this.service.save(dto,req.auth.user); }
  @Patch(':id') @RequirePermissions('employee.view','employee.update') update(@Param('id',ParseUUIDPipe) id:string,@Body() dto:UpdateEmployeeDto,@Req() req:AuthRequest) { return this.service.save(dto,req.auth.user,id); }
  @Delete(':id') @RequirePermissions('employee.view','employee.update') delete(@Param('id',ParseUUIDPipe) id:string) { return this.usersService.removeEmployeeAndUser(id); }
}
@ApiTags('Employee catalogs') @ApiBearerAuth() @Controller('employee-catalogs')
class CatalogController {
  constructor(private readonly service:EmployeesService) {}
  @Get() list() { return this.service.catalogs(); }
  @Post() @RequirePermissions('employee.catalog.manage') create(@Body() dto:CatalogDto, @Req() req: AuthRequest) {
    if (!dto.creatorName && req?.auth?.user?.displayName) {
      dto.creatorName = req.auth.user.displayName;
    }
    return this.service.saveCatalog(dto);
  }
  @Patch(':id') @RequirePermissions('employee.catalog.manage') update(@Param('id',ParseUUIDPipe) id:string,@Body() dto:UpdateCatalogDto) { return this.service.saveCatalog(dto,id); }
  @Delete(':id') @RequirePermissions('employee.catalog.manage') delete(@Param('id',ParseUUIDPipe) id:string) { return this.service.deleteCatalog(id); }
}
import { UsersModule } from '../users/users.module';

@Module({imports:[AuthModule, UsersModule],controllers:[EmployeesController,CatalogController],providers:[EmployeesService]})
export class EmployeesModule {}
