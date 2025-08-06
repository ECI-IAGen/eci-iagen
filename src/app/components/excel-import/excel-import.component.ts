import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-excel-import',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './excel-import.component.html',
    styleUrls: ['./excel-import.component.css']
})
export class ExcelImportComponent {
    selectedFile: File | null = null;
    importType: string = '';
    isDragOver = false;
    isImporting = false;

    triggerFileInput() {
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        fileInput?.click();
    }

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.selectedFile = input.files[0];
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
        }
    }

    removeFile() {
        this.selectedFile = null;
    }

    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async importData() {
        if (!this.selectedFile || !this.importType) return;

        this.isImporting = true;

        try {
            // Aquí implementarías la lógica de importación
            console.log('Importing file:', this.selectedFile.name);
            console.log('Import type:', this.importType);

            // Simular proceso de importación
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Aquí mostrarías un mensaje de éxito
            alert('Datos importados exitosamente');

            // Limpiar form
            this.selectedFile = null;
            this.importType = '';

        } catch (error) {
            console.error('Error importing data:', error);
            alert('Error al importar los datos');
        } finally {
            this.isImporting = false;
        }
    }
}