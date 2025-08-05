import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ApiService } from '../../services/api.service';
import { LayoutComponent } from '../layout/layout.component';
import { RoleComponent } from '../gateway/role/role.component';
import { UserComponent } from '../gateway/user/user.component';
import { ClassComponent } from '../gateway/class/class.component';
import { TeamComponent } from '../gateway/team/team.component';
import { AssignmentComponent } from '../gateway/assignment/assignment.component';
import { SubmissionComponent } from '../gateway/submission/submission.component';
import { EvaluationComponent } from '../gateway/evaluation/evaluation.component';
import { FeedbackComponent } from '../gateway/feedback/feedback.component';

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
  template: `
    <app-layout 
      [currentSection]="currentSection"
      (refresh)="refreshData()"
      (sectionChange)="showSection($event)">
      
      <!-- Sección de Usuarios -->
      <div *ngIf="currentSection === 'users'" class="section-content">
        <app-user></app-user>
      </div>

      <!-- Sección de Roles -->
      <div *ngIf="currentSection === 'roles'" class="section-content">
        <app-role></app-role>
      </div>

      <!-- Sección de Clases -->
      <div *ngIf="currentSection === 'classes'" class="section-content">
        <app-class></app-class>
      </div>

      <!-- Sección de Equipos -->
      <div *ngIf="currentSection === 'teams'" class="section-content">
        <app-team></app-team>
      </div>

      <!-- Sección de Asignaciones -->
      <div *ngIf="currentSection === 'assignments'" class="section-content">
        <app-assignment></app-assignment>
      </div>

      <!-- Sección de Entregas -->
      <div *ngIf="currentSection === 'submissions'" class="section-content">
        <app-submission></app-submission>
      </div>

      <!-- Sección de Evaluaciones -->
      <div *ngIf="currentSection === 'evaluations'" class="section-content">
        <app-evaluation></app-evaluation>
      </div>

      <!-- Sección de Retroalimentación -->
      <div *ngIf="currentSection === 'feedback'" class="section-content">
        <app-feedback></app-feedback>
      </div>

      <!-- Placeholder para secciones no implementadas -->
      <div *ngIf="currentSection !== '' && currentSection !== 'users' && currentSection !== 'roles' && currentSection !== 'classes' && currentSection !== 'teams' && currentSection !== 'assignments' && currentSection !== 'submissions' && currentSection !== 'evaluations' && currentSection !== 'feedback'" class="section-content">
        <div class="section-header">
          <h2 class="section-title">
            <i class="fas fa-cog me-2"></i>{{ getSectionTitle(currentSection) }}
          </h2>
          <p class="section-subtitle text-muted">Esta funcionalidad estará disponible próximamente</p>
        </div>
        
        <div class="section-body">
          <div class="coming-soon-container">
            <div class="text-center py-5">
              <div class="coming-soon-icon mb-4">
                <i class="fas fa-tools text-muted"></i>
              </div>
              <h4 class="text-muted mb-3">En Desarrollo</h4>
              <p class="text-muted mb-4">Estamos trabajando en esta funcionalidad</p>
              <button class="btn btn-outline-primary" (click)="showSection('users')">
                <i class="fas fa-arrow-left me-2"></i>Volver a Usuarios
              </button>
            </div>
          </div>
        </div>
      </div>
    </app-layout>

    <!-- Toast para notificaciones -->
    <div class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 2000;">
      <div id="notification-toast" class="toast" role="alert" [ngClass]="toastClass">
        <div class="toast-header">
          <strong class="me-auto">Notificación</strong>
          <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
        </div>
        <div class="toast-body">
          {{ toastMessage }}
        </div>
      </div>
    </div>
  `,
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
