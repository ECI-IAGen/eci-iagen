/**
 * DTO for Excel import response
 */
export interface ExcelImportResponseDTO {
  success: boolean;
  message: string;
  stats: ImportStats;
  errors: string[];
}

/**
 * Import statistics
 */
export interface ImportStats {
  usersCreated: number;
  usersUpdated: number;
  classesCreated: number;
  classesUpdated: number;
  rolesCreated: number;
  totalProcessed: number;
}

/**
 * Column information for Excel format
 */
export interface ColumnInfo {
  columnLetter: string;
  columnIndex: number;
  fieldName: string;
  description: string;
  required: boolean;
  dataType: string;
}

/**
 * Sheet format information
 */
export interface SheetFormatInfo {
  sheetName: string;
  description: string;
  headerRow: number;
  dataStartRow: number;
  columns: ColumnInfo[];
  processingType: string; // "GROUPS", "STUDENTS", "ASSIGNMENTS", etc.
}

/**
 * Complete Excel format information
 */
export interface ExcelFormatComplete {
  description: string;
  sheets: SheetFormatInfo[];
  version: string;
  supportedExtensions: string;
}

/**
 * Import types available
 */
export enum ImportType {
  COMPLETE = 'complete',
  GROUPS = 'groups',
  ENTREGAS = 'entregas',
  ESTUDIANTES = 'estudiantes',
  EQUIPOS = 'equipos'
}

/**
 * Processing types for sheets
 */
export enum ProcessingType {
  GROUPS = 'GROUPS',
  STUDENTS = 'STUDENTS',
  ASSIGNMENTS = 'ASSIGNMENTS',
  TEAMS = 'TEAMS',
  ENTREGAS = 'ENTREGAS'
}
