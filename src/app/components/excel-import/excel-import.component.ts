import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { 
    ExcelImportResponseDTO, 
    ExcelFormatComplete, 
    SheetFormatInfo,
    ImportType,
    ImportStats
} from '../../models/excel-import.models';

@Component({
    selector: 'app-excel-import',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './excel-import.component.html',
    styleUrls: ['./excel-import.component.css']
})
export class ExcelImportComponent implements OnInit {
    selectedFile: File | null = null;
    importType: ImportType = ImportType.COMPLETE;
    isDragOver = false;
    isImporting = false;
    isValidating = false;
    
    // Response data
    importResult: ExcelImportResponseDTO | null = null;
    formatInfo: ExcelFormatComplete | null = null;
    groupsFormatInfo: SheetFormatInfo | null = null;
    entregasFormatInfo: SheetFormatInfo | null = null;
    estudiantesFormatInfo: SheetFormatInfo | null = null;
    equiposFormatInfo: SheetFormatInfo | null = null;
    validationResult: ExcelImportResponseDTO | null = null;
    
    // Import types for template
    ImportType = ImportType;
    
    constructor(private apiService: ApiService) {}
    
    ngOnInit() {
        this.loadFormatInfo();
    }
    
    /**
     * Load format information on component initialization
     */
    async loadFormatInfo() {
        try {
            // Load complete format info
            this.apiService.getCompleteFormatInfo().subscribe({
                next: (data) => {
                    this.formatInfo = data;
                    console.log('Complete format info loaded:', data);
                },
                error: (error) => {
                    console.error('Error loading complete format info:', error);
                }
            });
            
            // Load groups specific format info
            this.apiService.getGroupsFormatInfo().subscribe({
                next: (data) => {
                    this.groupsFormatInfo = data;
                    console.log('Groups format info loaded:', data);
                },
                error: (error) => {
                    console.error('Error loading groups format info:', error);
                }
            });

            // Load entregas specific format info
            this.apiService.getEntregasFormatInfo().subscribe({
                next: (data) => {
                    this.entregasFormatInfo = data;
                    console.log('Entregas format info loaded:', data);
                },
                error: (error) => {
                    console.error('Error loading entregas format info:', error);
                }
            });

            // Load estudiantes specific format info
            this.apiService.getEstudiantesFormatInfo().subscribe({
                next: (data) => {
                    this.estudiantesFormatInfo = data;
                    console.log('Estudiantes format info loaded:', data);
                },
                error: (error) => {
                    console.error('Error loading estudiantes format info:', error);
                }
            });

            // Load equipos specific format info
            this.apiService.getEquiposFormatInfo().subscribe({
                next: (data) => {
                    this.equiposFormatInfo = data;
                    console.log('Equipos format info loaded:', data);
                },
                error: (error) => {
                    console.error('Error loading equipos format info:', error);
                }
            });
        } catch (error) {
            console.error('Error in loadFormatInfo:', error);
        }
    }

    triggerFileInput() {
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        fileInput?.click();
    }

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.selectedFile = input.files[0];
            this.clearResults();
        }
    }

    onDragOver(event: DragEvent) {
        event.preventDefault();
        this.isDragOver = true;
    }

    onDragLeave(event: DragEvent) {
        event.preventDefault();
        this.isDragOver = false;
    }

    onDrop(event: DragEvent) {
        event.preventDefault();
        this.isDragOver = false;

        if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
            this.selectedFile = event.dataTransfer.files[0];
            this.clearResults();
        }
    }

    removeFile() {
        this.selectedFile = null;
        this.clearResults();
    }
    
    /**
     * Clear all results when file or import type changes
     */
    clearResults() {
        this.importResult = null;
        this.validationResult = null;
    }
    
    /**
     * Handle import type change
     */
    onImportTypeChange() {
        this.clearResults();
    }

    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Validate the Excel file format before importing
     */
    async validateFormat() {
        if (!this.selectedFile) return;

        this.isValidating = true;
        this.validationResult = null;

        try {
            this.apiService.validateCompleteExcelFormat(this.selectedFile).subscribe({
                next: (response: ExcelImportResponseDTO) => {
                    this.validationResult = response;
                    console.log('Validation result:', response);
                    
                    if (response.success) {
                        this.showSuccessMessage('Archivo validado correctamente');
                    } else {
                        this.showErrorMessage('Error en validación: ' + response.message);
                    }
                },
                error: (error) => {
                    console.error('Error validating file:', error);
                    this.showErrorMessage('Error validando archivo: ' + error.message);
                },
                complete: () => {
                    this.isValidating = false;
                }
            });

        } catch (error) {
            console.error('Error in validateFormat:', error);
            this.showErrorMessage('Error inesperado validando archivo');
            this.isValidating = false;
        }
    }

    async importData() {
        if (!this.selectedFile || !this.importType) return;

        this.isImporting = true;
        this.importResult = null;

        try {
            let importObservable;
            
            switch (this.importType) {
                case ImportType.COMPLETE:
                    importObservable = this.apiService.importCompleteExcel(this.selectedFile);
                    break;
                case ImportType.GROUPS:
                case ImportType.ENTREGAS:
                case ImportType.ESTUDIANTES:
                case ImportType.EQUIPOS:
                    // For specific sheet types, use the legacy method for now
                    // You might want to create specific endpoints for each type later
                    importObservable = this.apiService.importExcel(this.selectedFile);
                    break;
                default:
                    throw new Error('Tipo de importación no válido');
            }

            importObservable.subscribe({
                next: (response: ExcelImportResponseDTO) => {
                    this.importResult = response;
                    console.log('Import result:', response);
                    
                    if (response.success) {
                        this.showSuccessMessage('Datos importados exitosamente');
                        this.showImportStats(response.stats);
                        
                        // Clear form after successful import
                        this.selectedFile = null;
                        this.importType = ImportType.COMPLETE;
                    } else {
                        this.showErrorMessage('Error en importación: ' + response.message);
                        if (response.errors && response.errors.length > 0) {
                            this.showErrors(response.errors);
                        }
                    }
                },
                error: (error) => {
                    console.error('Error importing data:', error);
                    this.showErrorMessage('Error importando datos: ' + error.message);
                },
                complete: () => {
                    this.isImporting = false;
                }
            });

        } catch (error) {
            console.error('Error in importData:', error);
            this.showErrorMessage('Error inesperado durante la importación');
            this.isImporting = false;
        }
    }
    
    /**
     * Display success message
     */
    private showSuccessMessage(message: string) {
        // You can replace this with a proper notification service
        alert(message);
    }
    
    /**
     * Display error message
     */
    private showErrorMessage(message: string) {
        // You can replace this with a proper notification service
        alert(message);
    }
    
    /**
     * Display import statistics
     */
    private showImportStats(stats: ImportStats) {
        const message = `
Estadísticas de importación:
- Usuarios creados: ${stats.usersCreated}
- Usuarios actualizados: ${stats.usersUpdated}
- Clases creadas: ${stats.classesCreated}
- Clases actualizadas: ${stats.classesUpdated}
- Roles creados: ${stats.rolesCreated}
- Total procesados: ${stats.totalProcessed}
        `;
        console.log('Import stats:', message);
    }
    
    /**
     * Display import errors
     */
    private showErrors(errors: string[]) {
        const errorMessage = 'Errores encontrados:\n' + errors.join('\n');
        console.error('Import errors:', errorMessage);
    }
}