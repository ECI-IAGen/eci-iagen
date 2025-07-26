import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';

interface Assignment {
  id: number;
  title: string;
  description: string;
  classId: number;
  className?: string;
  startDate: string | number[];
  dueDate: string | number[];
}

interface Class {
  id: number;
  name: string;
}

@Component({
  selector: 'app-assignment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './assignment.component.html',
  styleUrls: ['./assignment.component.css']
})
export class AssignmentComponent implements OnInit {
  assignments: Assignment[] = [];
  classes: Class[] = [];
  loading = false;
  
  // Modal states
  showCreateModal = false;
  showEditModal = false;
  showViewModal = false;
  
  // Form data
  assignmentForm: Partial<Assignment> = {};
  editingAssignmentId?: number;
  selectedAssignment?: Assignment;
  
  // Toast notification
  toastMessage = '';
  toastClass = '';

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadAssignments();
    this.loadClasses();
  }

  loadAssignments() {
    this.loading = true;
    this.apiService.getAssignments().subscribe({
      next: (data) => {
        this.assignments = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando asignaciones:', error);
        this.showToast('Error al cargar asignaciones: ' + error.message, 'danger');
        this.loading = false;
      }
    });
  }

  loadClasses() {
    this.apiService.getClasses().subscribe({
      next: (data) => {
        this.classes = data;
      },
      error: (error) => {
        console.error('Error cargando clases:', error);
        this.showToast('Error al cargar las clases disponibles', 'danger');
      }
    });
  }

  openCreateAssignmentModal() {
    this.assignmentForm = {
      classId: undefined,
      title: '',
      description: '',
      startDate: this.getCurrentDateTime(),
      dueDate: this.getDefaultDueDate()
    };
    this.showCreateModal = true;
  }

  openEditAssignmentModal(assignment: Assignment) {
    this.editingAssignmentId = assignment.id;
    this.assignmentForm = {
      classId: assignment.classId,
      title: assignment.title,
      description: assignment.description,
      startDate: this.formatDateTimeForInput(assignment.startDate),
      dueDate: this.formatDateTimeForInput(assignment.dueDate)
    };
    this.showEditModal = true;
  }

  viewAssignment(assignment: Assignment) {
    this.selectedAssignment = assignment;
    this.showViewModal = true;
  }

  createAssignment() {
    if (!this.isFormValid()) {
      this.showToast('Por favor complete todos los campos requeridos', 'danger');
      return;
    }

    const assignmentData = {
      classId: parseInt(this.assignmentForm.classId!.toString()),
      title: this.assignmentForm.title!,
      description: this.assignmentForm.description!,
      startDate: new Date().toISOString(), // Siempre usar fecha actual
      dueDate: this.assignmentForm.dueDate!
    };

    this.apiService.createAssignment(assignmentData).subscribe({
      next: () => {
        this.showToast('Asignación creada exitosamente', 'success');
        this.closeModal();
        this.loadAssignments();
      },
      error: (error) => {
        console.error('Error creando asignación:', error);
        this.showToast('Error al crear asignación: ' + error.message, 'danger');
      }
    });
  }

  updateAssignment() {
    if (!this.isFormValid() || !this.editingAssignmentId) {
      this.showToast('Por favor complete todos los campos requeridos', 'danger');
      return;
    }

    const assignmentData = {
      classId: parseInt(this.assignmentForm.classId!.toString()),
      title: this.assignmentForm.title!,
      description: this.assignmentForm.description!,
      startDate: this.assignmentForm.startDate!,
      dueDate: this.assignmentForm.dueDate!
    };

    this.apiService.updateAssignment(this.editingAssignmentId, assignmentData).subscribe({
      next: () => {
        this.showToast('Asignación actualizada exitosamente', 'success');
        this.closeModal();
        this.loadAssignments();
      },
      error: (error) => {
        console.error('Error actualizando asignación:', error);
        this.showToast('Error al actualizar asignación: ' + error.message, 'danger');
      }
    });
  }

  confirmDeleteAssignment(assignment: Assignment) {
    if (confirm(`¿Está seguro de que desea eliminar la asignación "${assignment.title}"?`)) {
      this.deleteAssignment(assignment.id);
    }
  }

  deleteAssignment(id: number) {
    this.apiService.deleteAssignment(id).subscribe({
      next: () => {
        this.showToast('Asignación eliminada exitosamente', 'success');
        this.loadAssignments();
      },
      error: (error) => {
        console.error('Error eliminando asignación:', error);
        this.showToast('Error al eliminar asignación: ' + error.message, 'danger');
      }
    });
  }

  closeModal() {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.showViewModal = false;
    this.assignmentForm = {};
    this.editingAssignmentId = undefined;
    this.selectedAssignment = undefined;
  }

  // Utility methods
  formatDate(dateInput: string | number[]): string {
    if (!dateInput) return 'N/A';
    try {
      const date = this.parseBackendDate(dateInput);
      return date ? date.toLocaleDateString() : 'N/A';
    } catch {
      return 'N/A';
    }
  }

  formatDateTime(dateInput: string | number[]): string {
    if (!dateInput) return 'N/A';
    try {
      const date = this.parseBackendDate(dateInput);
      return date ? date.toLocaleString() : 'N/A';
    } catch {
      return 'N/A';
    }
  }

  parseBackendDate(dateInput: string | number[]): Date | null {
    if (!dateInput) return null;
    
    try {
      // Si es un array (formato del backend: [año, mes, día, hora, minuto, segundo, nanosegundo])
      if (Array.isArray(dateInput) && dateInput.length >= 3) {
        const [year, month, day, hour = 0, minute = 0, second = 0] = dateInput;
        // Nota: el mes en JavaScript es 0-indexado, pero el backend envía 1-indexado
        return new Date(year, month - 1, day, hour, minute, second);
      }
      
      // Si es una cadena
      if (typeof dateInput === 'string') {
        return new Date(dateInput);
      }
      
      return null;
    } catch {
      return null;
    }
  }

  formatDateTimeForInput(dateInput: string | number[]): string {
    if (!dateInput) return '';
    try {
      const date = this.parseBackendDate(dateInput);
      return date ? date.toISOString().slice(0, 16) : '';
    } catch {
      return '';
    }
  }

  getCurrentDateTime(): string {
    return new Date().toISOString().slice(0, 16);
  }

  getDefaultDueDate(): string {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // 1 semana después
    return dueDate.toISOString().slice(0, 16);
  }

  getAssignmentStatus(assignment: Assignment): string {
    if (!assignment.dueDate) return 'Sin fecha límite';
    
    const now = new Date();
    const dueDate = this.parseBackendDate(assignment.dueDate);
    
    if (!dueDate) return 'Fecha inválida';
    
    if (dueDate < now) {
      return 'Vencida';
    } else if (dueDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
      return 'Próxima a vencer';
    } else {
      return 'Activa';
    }
  }

  getStatusBadgeClass(assignment: Assignment): string {
    const status = this.getAssignmentStatus(assignment);
    switch (status) {
      case 'Vencida':
        return 'bg-danger';
      case 'Próxima a vencer':
        return 'bg-warning';
      case 'Activa':
        return 'bg-success';
      default:
        return 'bg-secondary';
    }
  }

  isFormValid(): boolean {
    return !!(
      this.assignmentForm.classId &&
      this.assignmentForm.title &&
      this.assignmentForm.description &&
      this.assignmentForm.dueDate
    );
  }

  trackByAssignmentId(index: number, assignment: Assignment): number {
    return assignment.id;
  }

  showToast(message: string, type: 'success' | 'danger' = 'success') {
    this.toastMessage = message;
    this.toastClass = type === 'success' ? 'text-bg-success' : 'text-bg-danger';
    
    // Auto-hide toast after 5 seconds
    setTimeout(() => {
      this.toastMessage = '';
      this.toastClass = '';
    }, 5000);
  }
}
