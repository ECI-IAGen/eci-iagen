import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { Submission, Assignment, Team } from '../../../models/submission.models';

@Component({
  selector: 'app-submission',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './submission.component.html',
  styleUrls: ['./submission.component.css']
})
export class SubmissionComponent implements OnInit {
  
  // Datos principales
  submissions: Submission[] = [];
  assignments: Assignment[] = [];
  teams: Team[] = [];
  
  // Estados de la UI
  loading = false;
  submitting = false;
  
  // Estados de modales
  showCreateSubmissionModal = false;
  showViewSubmissionModal = false;
  showEditSubmissionModal = false;
  
  // Datos para formularios
  newSubmission: Partial<Submission> = {
    assignmentId: undefined,
    teamId: undefined,
    fileUrl: ''
  };
  
  editingSubmission: Partial<Submission> = {};
  selectedSubmission: Submission | null = null;
  
  constructor(private apiService: ApiService) {}
  
  ngOnInit() {
    this.loadSubmissions();
    this.loadAssignments();
    this.loadTeams();
  }
  
  // =================== MÉTODOS DE CARGA ===================
  
  async loadSubmissions() {
    this.loading = true;
    try {
      this.apiService.getSubmissions().subscribe({
        next: (data) => {
          this.submissions = data;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error cargando entregas:', error);
          this.showNotification('Error al cargar entregas: ' + error.message, 'error');
          this.loading = false;
        }
      });
    } catch (error: any) {
      console.error('Error cargando entregas:', error);
      this.showNotification('Error al cargar entregas: ' + error.message, 'error');
      this.loading = false;
    }
  }
  
  async loadAssignments() {
    try {
      this.apiService.getAssignments().subscribe({
        next: (data) => {
          this.assignments = data;
        },
        error: (error) => {
          console.error('Error cargando asignaciones:', error);
        }
      });
    } catch (error) {
      console.error('Error cargando asignaciones:', error);
    }
  }
  
  async loadTeams() {
    try {
      this.apiService.getTeams().subscribe({
        next: (data) => {
          this.teams = data;
        },
        error: (error) => {
          console.error('Error cargando equipos:', error);
        }
      });
    } catch (error) {
      console.error('Error cargando equipos:', error);
    }
  }
  
  // =================== MÉTODOS DE MODAL - CREAR ===================
  
  showCreateModal() {
    this.newSubmission = {
      assignmentId: undefined,
      teamId: undefined,
      fileUrl: ''
    };
    this.showCreateSubmissionModal = true;
  }
  
  closeCreateModal() {
    this.showCreateSubmissionModal = false;
    this.newSubmission = {
      assignmentId: undefined,
      teamId: undefined,
      fileUrl: ''
    };
  }
  
  async createSubmission() {
    if (!this.newSubmission.assignmentId || !this.newSubmission.teamId || !this.newSubmission.fileUrl) {
      this.showNotification('Por favor complete todos los campos obligatorios', 'error');
      return;
    }
    
    this.submitting = true;
    
    const submissionData = {
      assignmentId: Number(this.newSubmission.assignmentId),
      teamId: Number(this.newSubmission.teamId),
      fileUrl: this.newSubmission.fileUrl,
      submittedAt: new Date().toISOString()
    };
    
    try {
      this.apiService.createSubmission(submissionData).subscribe({
        next: () => {
          this.showNotification('Entrega creada exitosamente');
          this.closeCreateModal();
          this.loadSubmissions();
          this.submitting = false;
        },
        error: (error) => {
          this.showNotification('Error al crear entrega: ' + error.message, 'error');
          this.submitting = false;
        }
      });
    } catch (error: any) {
      this.showNotification('Error al crear entrega: ' + error.message, 'error');
      this.submitting = false;
    }
  }
  
  // =================== MÉTODOS DE MODAL - VER ===================
  
  async viewSubmission(id: number) {
    try {
      this.apiService.getSubmissionById(id).subscribe({
        next: (data) => {
          this.selectedSubmission = data;
          this.showViewSubmissionModal = true;
        },
        error: (error) => {
          this.showNotification('Error al cargar detalles de la entrega: ' + error.message, 'error');
        }
      });
    } catch (error: any) {
      this.showNotification('Error al cargar detalles de la entrega: ' + error.message, 'error');
    }
  }
  
  closeViewModal() {
    this.showViewSubmissionModal = false;
    this.selectedSubmission = null;
  }
  
  // =================== MÉTODOS DE MODAL - EDITAR ===================
  
  async editSubmission(id: number) {
    try {
      this.apiService.getSubmissionById(id).subscribe({
        next: (data) => {
          this.selectedSubmission = data;
          this.editingSubmission = {
            assignmentId: data.assignmentId,
            teamId: data.teamId,
            fileUrl: data.fileUrl,
            submittedAt: data.submittedAt
          };
          this.showEditSubmissionModal = true;
        },
        error: (error) => {
          this.showNotification('Error al cargar datos de la entrega: ' + error.message, 'error');
        }
      });
    } catch (error: any) {
      this.showNotification('Error al cargar datos de la entrega: ' + error.message, 'error');
    }
  }
  
  closeEditModal() {
    this.showEditSubmissionModal = false;
    this.selectedSubmission = null;
    this.editingSubmission = {};
  }
  
  async updateSubmission() {
    if (!this.selectedSubmission || !this.editingSubmission.assignmentId || 
        !this.editingSubmission.teamId || !this.editingSubmission.fileUrl) {
      this.showNotification('Por favor complete todos los campos obligatorios', 'error');
      return;
    }
    
    this.submitting = true;
    
    // Convertir la fecha a formato ISO si viene como array
    let submittedAtISO: string;
    if (Array.isArray(this.selectedSubmission.submittedAt)) {
      const dateArray = this.selectedSubmission.submittedAt;
      if (dateArray.length >= 6) {
        const date = new Date(
          dateArray[0], // año
          dateArray[1] - 1, // mes (restar 1)
          dateArray[2], // día
          dateArray[3], // hora
          dateArray[4], // minuto
          dateArray[5] // segundo
        );
        submittedAtISO = date.toISOString();
      } else {
        submittedAtISO = new Date().toISOString();
      }
    } else {
      submittedAtISO = this.selectedSubmission.submittedAt;
    }
    
    const submissionData = {
      assignmentId: Number(this.editingSubmission.assignmentId),
      teamId: Number(this.editingSubmission.teamId),
      fileUrl: this.editingSubmission.fileUrl,
      submittedAt: submittedAtISO
    };
    
    try {
      this.apiService.updateSubmission(this.selectedSubmission.id, submissionData).subscribe({
        next: () => {
          this.showNotification('Entrega actualizada exitosamente');
          this.closeEditModal();
          this.loadSubmissions();
          this.submitting = false;
        },
        error: (error) => {
          this.showNotification('Error al actualizar entrega: ' + error.message, 'error');
          this.submitting = false;
        }
      });
    } catch (error: any) {
      this.showNotification('Error al actualizar entrega: ' + error.message, 'error');
      this.submitting = false;
    }
  }
  
  // =================== MÉTODO DE ELIMINAR ===================
  
  async deleteSubmission(id: number) {
    if (!confirm('¿Está seguro de que desea eliminar esta entrega?')) {
      return;
    }
    
    try {
      this.apiService.deleteSubmission(id).subscribe({
        next: () => {
          this.showNotification('Entrega eliminada exitosamente');
          this.loadSubmissions();
        },
        error: (error) => {
          this.showNotification('Error al eliminar entrega: ' + error.message, 'error');
        }
      });
    } catch (error: any) {
      this.showNotification('Error al eliminar entrega: ' + error.message, 'error');
    }
  }
  
  // =================== MÉTODOS DE UTILIDAD ===================
  
  closeAllModals() {
    this.showCreateSubmissionModal = false;
    this.showViewSubmissionModal = false;
    this.showEditSubmissionModal = false;
    this.selectedSubmission = null;
    this.editingSubmission = {};
  }
  
  getAssignmentTitle(submission: Submission): string {
    if (submission.assignmentTitle) {
      return submission.assignmentTitle;
    }
    const assignment = this.assignments.find(a => a.id === submission.assignmentId);
    return assignment ? assignment.title : 'Sin asignación';
  }
  
  getTeamName(submission: Submission): string {
    if (submission.teamName) {
      return submission.teamName;
    }
    const team = this.teams.find(t => t.id === submission.teamId);
    return team ? team.name : 'Sin equipo';
  }
  
  getFileName(url: string): string {
    if (!url) return 'Sin archivo';
    const fileName = url.split('/').pop();
    return fileName || 'Archivo';
  }
  
  formatDate(dateInput: string | number[]): string {
    if (!dateInput) return 'N/A';
    
    try {
      let date: Date;
      
      // Si es un array (formato del backend: [year, month, day, hour, minute, second, nanosecond])
      if (Array.isArray(dateInput)) {
        if (dateInput.length >= 6) {
          // Los meses en JavaScript van de 0-11, pero el backend envía 1-12
          date = new Date(
            dateInput[0], // año
            dateInput[1] - 1, // mes (restar 1)
            dateInput[2], // día
            dateInput[3], // hora
            dateInput[4], // minuto
            dateInput[5] // segundo
          );
        } else {
          return 'Fecha inválida';
        }
      } else {
        // Si es una cadena ISO normal
        date = new Date(dateInput);
      }
      
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      
      return date.toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return 'Fecha inválida';
    }
  }
  
  formatDateForInput(dateInput: string | number[]): string {
    if (!dateInput) return '';
    
    try {
      let date: Date;
      
      // Si es un array (formato del backend)
      if (Array.isArray(dateInput)) {
        if (dateInput.length >= 6) {
          date = new Date(
            dateInput[0], // año
            dateInput[1] - 1, // mes (restar 1)
            dateInput[2], // día
            dateInput[3], // hora
            dateInput[4], // minuto
            dateInput[5] // segundo
          );
        } else {
          return '';
        }
      } else {
        // Si es una cadena ISO normal
        date = new Date(dateInput);
      }
      
      if (isNaN(date.getTime())) {
        return '';
      }
      
      return date.toISOString().slice(0, 16);
    } catch (error) {
      console.error('Error formateando fecha para input:', error);
      return '';
    }
  }
  
  getCurrentDateTime(): string {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  }
  
  // =================== MÉTODO DE NOTIFICACIONES ===================
  
  private showNotification(message: string, type: 'success' | 'error' = 'success') {
    // Implementación básica de notificación usando alert
    // En un proyecto real, se podría usar una librería como ngx-toastr
    if (type === 'error') {
      console.error(message);
      alert('Error: ' + message);
    } else {
      console.log(message);
      alert(message);
    }
  }
}
