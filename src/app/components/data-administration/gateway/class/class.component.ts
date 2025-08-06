import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../services/api.service';

declare var bootstrap: any;

@Component({
  selector: 'app-class',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './class.component.html',
  styleUrls: ['./class.component.css']
})
export class ClassComponent implements OnInit {
  loading = false;
  classes: any[] = [];
  users: any[] = [];
  teams: any[] = [];
  professors: any[] = [];
  
  // Toast
  toastMessage = '';
  toastClass = '';

  // Modal state
  showCreateModal = false;
  showEditModal = false;
  showViewModal = false;
  selectedClass: any = null;
  
  // Form data
  classForm = {
    name: '',
    description: '',
    semester: '',
    professorId: '',
    laboratoryProfessorId: '',
    teamIds: [] as number[]
  };

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadClasses();
    this.loadUsersAndTeams();
  }

  async loadClasses() {
    try {
      this.loading = true;
      this.classes = await this.apiService.getClasses().toPromise() || [];
      console.log('Clases cargadas:', this.classes.length);
    } catch (error) {
      console.error('Error cargando clases:', error);
      this.showNotification('Error al cargar clases: ' + (error as Error).message, 'error');
    } finally {
      this.loading = false;
    }
  }

  async loadUsersAndTeams() {
    try {
      if (this.users.length === 0) {
        this.users = await this.apiService.getUsers().toPromise() || [];
        // Filtrar profesores
        this.professors = this.users.filter(user => 
          user.roleName === 'PROFESOR' || user.roleName === 'Profesor'
        );
      }
      if (this.teams.length === 0) {
        this.teams = await this.apiService.getTeams().toPromise() || [];
      }
    } catch (error) {
      console.error('Error al cargar usuarios y equipos:', error);
      this.showNotification('Error al cargar datos auxiliares', 'error');
    }
  }

  showNotification(message: string, type: 'success' | 'error' | 'info' = 'success') {
    this.toastMessage = message;
    this.toastClass = type === 'error' ? 'bg-danger' : type === 'info' ? 'bg-info' : 'bg-success';

    // Mostrar toast usando Bootstrap
    setTimeout(() => {
      const toastElement = document.getElementById('class-notification-toast');
      if (toastElement) {
        const toast = new bootstrap.Toast(toastElement);
        toast.show();
      }
    }, 100);
  }

  // Utilidades para el template
  trackByClassId(index: number, classItem: any): number {
    return classItem.id;
  }

  getProfessorInitial(professorName: string): string {
    return (professorName || '').charAt(0).toUpperCase();
  }

  getLaboratoryProfessorInitial(professorName: string): string {
    return (professorName || '').charAt(0).toUpperCase();
  }

  getTeamCount(classItem: any): number {
    return classItem.teamNames ? classItem.teamNames.length : 0;
  }

  getTeamsDisplay(classItem: any): string {
    if (classItem.teamNames && classItem.teamNames.length > 0) {
      const teamsToShow = classItem.teamNames.slice(0, 2).join(', ');
      if (classItem.teamNames.length > 2) {
        return teamsToShow + ` (+${classItem.teamNames.length - 2})`;
      }
      return teamsToShow;
    }
    return 'Sin equipos';
  }

  formatDate(dateInput: any): string {
    try {
      let date;
      
      if (typeof dateInput === 'string') {
        if (dateInput.includes(' ') && dateInput.includes('-')) {
          const isoString = dateInput.replace(' ', 'T') + 'Z';
          date = new Date(isoString);
        } else {
          date = new Date(dateInput);
        }
      } else if (Array.isArray(dateInput)) {
        date = new Date(dateInput[0], dateInput[1] - 1, dateInput[2], 
                       dateInput[3] || 0, dateInput[4] || 0, dateInput[5] || 0);
      } else {
        date = new Date(dateInput);
      }

      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }

      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      console.error('Error al formatear fecha:', error, dateInput);
      return 'Error en fecha';
    }
  }

  // Métodos para gestión de clases
  async viewClass(classItem: any) {
    try {
      this.selectedClass = await this.apiService.getClassById(classItem.id).toPromise();
      this.showViewModal = true;
    } catch (error) {
      console.error('Error cargando detalles de la clase:', error);
      this.showNotification('Error al cargar detalles de la clase: ' + (error as Error).message, 'error');
    }
  }

  async openCreateClassModal() {
    await this.loadUsersAndTeams();
    this.resetForm();
    this.showCreateModal = true;
  }

  async openEditClassModal(classItem: any) {
    try {
      await this.loadUsersAndTeams();
      this.selectedClass = await this.apiService.getClassById(classItem.id).toPromise();
      
      // Poblar el formulario con los datos de la clase
      this.classForm = {
        name: this.selectedClass.name || '',
        description: this.selectedClass.description || '',
        semester: this.selectedClass.semester || '',
        professorId: this.selectedClass.professorId || '',
        laboratoryProfessorId: this.selectedClass.laboratoryProfessorId || '',
        teamIds: this.selectedClass.teamIds || []
      };
      
      this.showEditModal = true;
    } catch (error) {
      console.error('Error cargando datos de la clase:', error);
      this.showNotification('Error al cargar datos de la clase: ' + (error as Error).message, 'error');
    }
  }

  async createClass() {
    try {
      const classData = {
        name: this.classForm.name.trim(),
        description: this.classForm.description?.trim() || null,
        semester: this.classForm.semester?.trim() || null,
        professorId: parseInt(this.classForm.professorId as string),
        laboratoryProfessorId: this.classForm.laboratoryProfessorId ? 
          parseInt(this.classForm.laboratoryProfessorId as string) : null,
        teamIds: this.classForm.teamIds
      };

      await this.apiService.createClass(classData).toPromise();
      this.showCreateModal = false;
      this.showNotification('Clase creada correctamente');
      this.loadClasses();
      this.resetForm();
    } catch (error) {
      console.error('Error creando clase:', error);
      this.showNotification('Error al crear la clase: ' + (error as Error).message, 'error');
    }
  }

  async updateClass() {
    try {
      const classData = {
        name: this.classForm.name.trim(),
        description: this.classForm.description?.trim() || null,
        semester: this.classForm.semester?.trim() || null,
        professorId: parseInt(this.classForm.professorId as string),
        laboratoryProfessorId: this.classForm.laboratoryProfessorId ? 
          parseInt(this.classForm.laboratoryProfessorId as string) : null,
        teamIds: this.classForm.teamIds
      };

      await this.apiService.updateClass(this.selectedClass.id, classData).toPromise();
      this.showEditModal = false;
      this.showNotification('Clase actualizada correctamente');
      this.loadClasses();
      this.resetForm();
    } catch (error) {
      console.error('Error actualizando clase:', error);
      this.showNotification('Error al actualizar la clase: ' + (error as Error).message, 'error');
    }
  }

  async confirmDeleteClass(classItem: any) {
    if (confirm('¿Estás seguro de que deseas eliminar esta clase? Esta acción no se puede deshacer.')) {
      try {
        await this.apiService.deleteClass(classItem.id).toPromise();
        this.showNotification('Clase eliminada correctamente');
        this.loadClasses();
      } catch (error) {
        console.error('Error eliminando clase:', error);
        this.showNotification('Error al eliminar la clase: ' + (error as Error).message, 'error');
      }
    }
  }

  manageTeams(classItem: any) {
    this.showNotification('Gestión de equipos próximamente', 'info');
  }

  manageTeamsFromView() {
    this.closeModal();
    this.manageTeams(this.selectedClass);
  }

  editFromView() {
    this.showViewModal = false;
    this.openEditClassModal(this.selectedClass);
  }

  resetForm() {
    this.classForm = {
      name: '',
      description: '',
      semester: '',
      professorId: '',
      laboratoryProfessorId: '',
      teamIds: []
    };
    this.selectedClass = null;
  }

  closeModal() {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.showViewModal = false;
    this.resetForm();
  }

  onTeamSelectionChange(event: Event, teamId: number) {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      if (!this.classForm.teamIds.includes(teamId)) {
        this.classForm.teamIds.push(teamId);
      }
    } else {
      this.classForm.teamIds = this.classForm.teamIds.filter(id => id !== teamId);
    }
  }

  isTeamSelected(teamId: number): boolean {
    return this.classForm.teamIds.includes(teamId);
  }
}
