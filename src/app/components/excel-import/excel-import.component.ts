import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-excel-import',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="excel-import-container">
      <div class="container py-5">
        <!-- Header -->
        <div class="text-center mb-5">
          <div class="import-icon mb-4">
            <i class="fas fa-file-excel text-success"></i>
          </div>
          <h2 class="import-title mb-3">Importar Datos desde Excel</h2>
          <p class="lead text-muted mb-4">
            Sube archivos de Excel para importar datos masivamente al sistema
          </p>
          <nav aria-label="breadcrumb">
            <ol class="breadcrumb justify-content-center">
              <li class="breadcrumb-item">
                <a routerLink="/" class="text-decoration-none">
                  <i class="fas fa-home me-1"></i>Inicio
                </a>
              </li>
              <li class="breadcrumb-item active" aria-current="page">
                Importar Excel
              </li>
            </ol>
          </nav>
        </div>

        <!-- Import Options -->
        <div class="row justify-content-center">
          <div class="col-lg-8">
            <div class="card shadow-sm">
              <div class="card-header bg-success text-white">
                <h5 class="card-title mb-0">
                  <i class="fas fa-upload me-2"></i>Opciones de Importación
                </h5>
              </div>
              <div class="card-body p-4">
                <!-- Upload Area -->
                <div class="upload-area mb-4">
                  <div class="upload-zone" (click)="triggerFileInput()" 
                       (dragover)="onDragOver($event)" 
                       (dragleave)="onDragLeave($event)"
                       (drop)="onDrop($event)"
                       [class.drag-over]="isDragOver">
                    <div class="text-center py-5">
                      <i class="fas fa-cloud-upload-alt text-muted mb-3" style="font-size: 3rem;"></i>
                      <h5 class="text-muted mb-2">Arrastra tu archivo Excel aquí</h5>
                      <p class="text-muted mb-3">o</p>
                      <button type="button" class="btn btn-outline-success">
                        <i class="fas fa-folder-open me-2"></i>Seleccionar Archivo
                      </button>
                      <input #fileInput type="file" class="d-none" accept=".xlsx,.xls" (change)="onFileSelected($event)">
                    </div>
                  </div>
                </div>

                <!-- File Info -->
                <div *ngIf="selectedFile" class="selected-file mb-4">
                  <div class="alert alert-info">
                    <div class="d-flex align-items-center">
                      <i class="fas fa-file-excel text-success me-3" style="font-size: 1.5rem;"></i>
                      <div class="flex-grow-1">
                        <strong>{{ selectedFile.name }}</strong>
                        <br>
                        <small class="text-muted">{{ formatFileSize(selectedFile.size) }}</small>
                      </div>
                      <button type="button" class="btn btn-sm btn-outline-danger" (click)="removeFile()">
                        <i class="fas fa-times"></i>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Import Type Selection -->
                <div class="import-types mb-4">
                  <h6 class="mb-3">Tipo de Datos a Importar:</h6>
                  <div class="row">
                    <div class="col-md-6 mb-3">
                      <div class="form-check">
                        <input class="form-check-input" type="radio" name="importType" id="users" value="users" [(ngModel)]="importType">
                        <label class="form-check-label" for="users">
                          <i class="fas fa-users text-primary me-2"></i>Usuarios
                        </label>
                      </div>
                    </div>
                    <div class="col-md-6 mb-3">
                      <div class="form-check">
                        <input class="form-check-input" type="radio" name="importType" id="classes" value="classes" [(ngModel)]="importType">
                        <label class="form-check-label" for="classes">
                          <i class="fas fa-chalkboard text-info me-2"></i>Clases
                        </label>
                      </div>
                    </div>
                    <div class="col-md-6 mb-3">
                      <div class="form-check">
                        <input class="form-check-input" type="radio" name="importType" id="teams" value="teams" [(ngModel)]="importType">
                        <label class="form-check-label" for="teams">
                          <i class="fas fa-user-friends text-warning me-2"></i>Equipos
                        </label>
                      </div>
                    </div>
                    <div class="col-md-6 mb-3">
                      <div class="form-check">
                        <input class="form-check-input" type="radio" name="importType" id="assignments" value="assignments" [(ngModel)]="importType">
                        <label class="form-check-label" for="assignments">
                          <i class="fas fa-tasks text-success me-2"></i>Asignaciones
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="text-center">
                  <button type="button" class="btn btn-success me-3" 
                          [disabled]="!selectedFile || !importType || isImporting"
                          (click)="importData()">
                    <i class="fas fa-upload me-2"></i>
                    <span *ngIf="!isImporting">Importar Datos</span>
                    <span *ngIf="isImporting">
                      <span class="spinner-border spinner-border-sm me-2"></span>
                      Importando...
                    </span>
                  </button>
                  <a routerLink="/" class="btn btn-outline-secondary">
                    <i class="fas fa-arrow-left me-2"></i>Volver al Inicio
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Help Section -->
        <div class="row justify-content-center mt-5">
          <div class="col-lg-8">
            <div class="card">
              <div class="card-header">
                <h6 class="card-title mb-0">
                  <i class="fas fa-info-circle me-2"></i>Información Importante
                </h6>
              </div>
              <div class="card-body">
                <ul class="mb-0">
                  <li>Solo se aceptan archivos en formato Excel (.xlsx, .xls)</li>
                  <li>La primera fila debe contener los nombres de las columnas</li>
                  <li>Asegúrate de que los datos estén en el formato correcto</li>
                  <li>El proceso puede tardar unos minutos dependiendo del tamaño del archivo</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .excel-import-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #e8f5e8 0%, #f0f8f0 100%);
    }

    .import-icon i {
      font-size: 4rem;
    }

    .import-title {
      font-size: 2.5rem;
      font-weight: 300;
      color: #2c3e50;
    }

    .upload-area {
      border: 2px dashed #28a745;
      border-radius: 8px;
      background-color: #f8f9fa;
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .upload-area:hover,
    .upload-area.drag-over {
      border-color: #20c997;
      background-color: #e8f5e8;
    }

    .upload-zone {
      min-height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .selected-file {
      border-radius: 8px;
    }

    .import-types .form-check {
      padding: 10px;
      border: 1px solid #e9ecef;
      border-radius: 6px;
      transition: all 0.3s ease;
    }

    .import-types .form-check:hover {
      background-color: #f8f9fa;
      border-color: #28a745;
    }

    .import-types .form-check-input:checked + .form-check-label {
      color: #28a745;
      font-weight: 600;
    }

    .breadcrumb {
      background: transparent;
      padding: 0;
    }

    .breadcrumb-item + .breadcrumb-item::before {
      content: ">";
      color: #6c757d;
    }
  `]
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
