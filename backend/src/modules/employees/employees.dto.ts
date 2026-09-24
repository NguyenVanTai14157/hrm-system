import { Type, Transform } from 'class-transformer';
import { IsString, IsOptional, IsEnum, IsUUID, IsInt, IsNumber, Min, Max, MaxLength, Matches, IsEmail, IsBoolean, IsNotEmpty, IsArray } from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
export const employeeSortFields = ['code','name','birthday','joinDate','gender','email','phone','address','status','department','position','jobTitle','manager'] as const;
export type EmployeeSortField = typeof employeeSortFields[number];
export type EmployeeGroupField = 'departmentId' | 'positionId' | 'jobTitleId' | 'status';
import { EmployeeStatus, Gender, CatalogKind } from '../../generated/prisma/client';
const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;
const emptyToUndefined = ({ value }: { value: unknown }) => (value === '' || value === null || value === undefined) ? undefined : (typeof value === 'string' ? value.trim() : value);
const toInteger = ({ value }: { value: unknown }) => {
  if (value === '' || value === null || value === undefined) return undefined;
  if (typeof value === 'number') return Math.round(value);
  if (typeof value === 'string') {
    const cleaned = value.replace(/,/g, '').trim();
    const num = Number(cleaned);
    return Number.isFinite(num) ? Math.round(num) : undefined;
  }
  return undefined;
};

export class CreateEmployeeDto {
  @Transform(emptyToUndefined) @IsOptional() @IsString() code?: string;
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(150) name!: string;
  @Transform(emptyToUndefined) @IsOptional() @IsEnum(Gender) gender?: Gender | null;
  @Transform(emptyToUndefined) @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) birthday?: string | null;
  @Transform(emptyToUndefined) @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) joinDate?: string | null;
  @Transform(emptyToUndefined) @IsOptional() @IsEmail() @MaxLength(254) email?: string | null;
  @Transform(emptyToUndefined) @IsOptional() @IsString() @MaxLength(30) phone?: string | null;
  @Transform(emptyToUndefined) @IsOptional() @IsString() @MaxLength(500) address?: string | null;
  @Transform(emptyToUndefined) @IsOptional() @IsEnum(EmployeeStatus) status?: EmployeeStatus;
  @Transform(emptyToUndefined) @IsOptional() @IsUUID() departmentId?: string | null;
  @Transform(emptyToUndefined) @IsOptional() @IsUUID() positionId?: string | null;
  @Transform(emptyToUndefined) @IsOptional() @IsUUID() jobTitleId?: string | null;
  @Transform(emptyToUndefined) @IsOptional() @IsUUID() managerId?: string | null;

  @Transform(emptyToUndefined) @IsOptional() @IsString() syncCode?: string;
  @Transform(emptyToUndefined) @IsOptional() @IsString() nationality?: string;
  @Transform(emptyToUndefined) @IsOptional() @IsString() maritalStatus?: string;
  @Transform(emptyToUndefined) @IsOptional() @IsString() religion?: string;
  @Transform(emptyToUndefined) @IsOptional() @IsString() ethnicity?: string;
  @Transform(emptyToUndefined) @IsOptional() @IsString() taxCode?: string;
  @Transform(emptyToUndefined) @IsOptional() @IsString() militaryService?: string;
  @Transform(emptyToUndefined) @IsOptional() @IsString() birthPlace?: string;
  @Transform(emptyToUndefined) @IsOptional() @IsString() hometown?: string;
  @Transform(emptyToUndefined) @IsOptional() @IsString() workType?: string;
  @Transform(emptyToUndefined) @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) officialContractDate?: string;
  @Transform(emptyToUndefined) @IsOptional() @IsString() academicLevel?: string;
  @Transform(emptyToUndefined) @IsOptional() @IsString() highSchoolLevel?: string;
  @Transform(emptyToUndefined) @IsOptional() @IsString() major?: string;
  @Transform(toInteger) @IsOptional() @IsInt() experienceYears?: number;
  @Transform(emptyToUndefined) @IsOptional() @IsString() permanentAddress?: string;
  @Transform(emptyToUndefined) @IsOptional() @IsString() minWageZone?: string;
  @Transform(emptyToUndefined) @IsOptional() @IsString() gpsLocation?: string;
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (Array.isArray(value)) return value.filter((v: unknown) => typeof v === 'string' && v.trim().length > 0);
    if (typeof value === 'string') return [value.trim()];
    return value;
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  gpsLocationIds?: string[];
  @Transform(toInteger) @IsOptional() @IsInt() salaryBase?: number;

  @IsOptional() @IsBoolean() createUserAccount?: boolean;

  @IsOptional() @IsArray() identities?: any[];
  @IsOptional() @IsArray() banks?: any[];
  @IsOptional() @IsArray() workPermits?: any[];
  @IsOptional() @IsArray() visas?: any[];
  @IsOptional() @IsArray() families?: any[];
  @IsOptional() @IsArray() educations?: any[];
  @IsOptional() @IsArray() partyHistories?: any[];
  @IsOptional() @IsArray() experiences?: any[];
  @IsOptional() @IsArray() certificates?: any[];
}
export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {
  @IsInt() @Min(0) version!: number;
}
export class EmployeeQuery {
  @IsOptional() @IsIn(employeeSortFields) sortBy?: EmployeeSortField;
  @IsOptional() @IsIn(['asc','desc']) sortDirection: 'asc' | 'desc' = 'asc';
  @IsOptional() @IsIn(['departmentId','positionId','jobTitleId','status']) groupBy?: EmployeeGroupField;
  @Type(() => Number) @IsInt() @Min(1) page = 1;
  @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 20;
  @IsOptional() @IsString() @MaxLength(150) q?: string;
  @IsOptional() @IsEnum(EmployeeStatus) status?: EmployeeStatus;
  @IsOptional() @IsUUID() departmentId?: string;
  @IsOptional() @IsUUID() positionId?: string;
}
export class CatalogDto {
  @IsEnum(CatalogKind) kind!: CatalogKind;
  @Transform(trim) @Matches(/^[a-zA-Z0-9._-]{1,50}$/) code!: string;
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(150) name!: string;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsString() parentId?: string;
  @IsOptional() @IsString() permissionStructure?: string;
  @IsOptional() @IsBoolean() isManagementUnit?: boolean;
  @IsOptional() @IsString() supervisorId?: string;
  @IsOptional() @IsString() businessBlock?: string;
  @IsOptional() @IsString() departmentType?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() correspondingJobTitleId?: string;
  @IsOptional() @IsString() roleId?: string;
  @IsOptional() @IsNumber() salaryFrom?: number;
  @IsOptional() @IsNumber() salaryTo?: number;
  @IsOptional() @IsString() creatorName?: string;
  @IsOptional() @IsNumber() orderNumber?: number;
  @IsOptional() @IsString() rankLevel?: string;
}
export class UpdateCatalogDto extends PartialType(CatalogDto) {}
