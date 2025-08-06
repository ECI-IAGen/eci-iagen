import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ApiService } from '../../services/api.service';
import { LayoutComponent } from './layout/layout.component';
import { RoleComponent } from './gateway/role/role.component';
import { UserComponent } from './gateway/user/user.component';
import { ClassComponent } from './gateway/class/class.component';
import { TeamComponent } from './gateway/team/team.component';
import { AssignmentComponent } from './gateway/assignment/assignment.component';
import { SubmissionComponent } from './gateway/submission/submission.component';
import { EvaluationComponent } from './gateway/evaluation/evaluation.component';
import { FeedbackComponent } from './gateway/feedback/feedback.component';

declare var bootstrap: any;

@Component({
  selector: 'app-data-administration',
  standalone: true,
  imports: [
    CommonModule, 
    HttpClientModule, 
    LayoutComponent, 
    RoleComponent, 
    UserComponent, 
    ClassComponent, 
    TeamComponent, 
    AssignmentComponent, 
    SubmissionComponent, 
    EvaluationComponent, 
    FeedbackComponent
  ],
  templateUrl: './data-administration.component.html',
  styleUrls: ['./data-administration.component.css']
})
export class DataAdministrationComponent implements OnInit {
  currentSection = 'users'; // Por defecto mostramos usuarios
  loading = false;
  
  // Datos
  roles: any[] = [];
  teams: any[] = [];
  classes: any[] = [];
  assignments: any[] = [];
  submissions: any[] = [];
  evaluations: any[] = [];
  feedbacks: any[] = [];

  // Toast
  toastMessage = '';
  toastClass = '';

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    // Cargar datos iniciales
    this.loadInitialData();
  }

  async loadInitialData() {
    try {
      this.loading = true;
      // Aquí puedes cargar los datos iniciales si es necesario
      await this.refreshData();
    } catch (error) {
      console.error('Error loading initial data:', error);
      this.showToast('Error al cargar los datos iniciales', 'error');
    } finally {
      this.loading = false;
    }
  }

  showSection(section: string) {
    this.currentSection = section;
  }

  async refreshData() {
    try {
      this.loading = true;
      // Aquí puedes implementar la lógica de refresco de datos
      console.log('Refreshing data...');
    } catch (error) {
      console.error('Error refreshing data:', error);
      this.showToast('Error al actualizar los datos', 'error');
    } finally {
      this.loading = false;
    }
  }

  getSectionTitle(section: string): string {
    const titles: { [key: string]: string } = {
      'users': 'Gestión de Usuarios',
      'roles': 'Gestión de Roles',
      'classes': 'Gestión de Clases',
      'teams': 'Gestión de Equipos',
      'assignments': 'Gestión de Asignaciones',
      'submissions': 'Gestión de Entregas',
      'evaluations': 'Gestión de Evaluaciones',
      'feedback': 'Gestión de Retroalimentación'
    };
    return titles[section] || 'Sección';
  }

  showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    this.toastMessage = message;
    this.toastClass = `bg-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info'} text-white`;
    
    const toastElement = document.getElementById('notification-toast');
    if (toastElement) {
      const toast = new bootstrap.Toast(toastElement);
      toast.show();
    }
  }
}