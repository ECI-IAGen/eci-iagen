import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { ApiService } from './services/api.service';
import { LayoutComponent } from './components/layout/layout.component';
import { RoleComponent } from './components/gateway/role/role.component';
import { UserComponent } from './components/gateway/user/user.component';
import { ClassComponent } from './components/gateway/class/class.component';
import { TeamComponent } from './components/gateway/team/team.component';
import { AssignmentComponent } from './components/gateway/assignment/assignment.component';
import { SubmissionComponent } from './components/gateway/submission/submission.component';
import { EvaluationComponent } from './components/gateway/evaluation/evaluation.component';
import { FeedbackComponent } from './components/gateway/feedback/feedback.component';

declare var bootstrap: any;

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, HttpClientModule, LayoutComponent, RoleComponent, UserComponent, ClassComponent, TeamComponent, AssignmentComponent, SubmissionComponent, EvaluationComponent, FeedbackComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'ECI IAGen';
  currentSection = '';
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
      console.log('Cargando datos iniciales...');

      // Cargar todos los datos en paralelo
      const promises = [
        this.apiService.getRoles().toPromise(),
        this.apiService.getTeams().toPromise(),
        this.apiService.getClasses().toPromise(),
        this.apiService.getAssignments().toPromise(),
        this.apiService.getSubmissions().toPromise(),
        this.apiService.getEvaluations().toPromise(),
        this.apiService.getFeedbacks().toPromise()
      ];

      const [roles, teams, classes, assignments, submissions, evaluations, feedbacks] = await Promise.all(promises);

      this.roles = roles || [];
      this.teams = teams || [];
      this.classes = classes || [];
      this.assignments = assignments || [];
      this.submissions = submissions || [];
      this.evaluations = evaluations || [];
      this.feedbacks = feedbacks || [];

      console.log('Datos iniciales cargados:', {
        roles: this.roles.length,
        teams: this.teams.length,
        classes: this.classes.length,
        assignments: this.assignments.length,
        submissions: this.submissions.length,
        evaluations: this.evaluations.length,
        feedbacks: this.feedbacks.length
      });

    } catch (error) {
      console.error('Error cargando datos iniciales:', error);
      this.showNotification('Error al cargar datos iniciales: ' + (error as Error).message, 'error');
    } finally {
      this.loading = false;
    }
  }

  showSection(section: string) {
    console.log(`Cambiando a sección: ${section}`);
    this.currentSection = section;

    // Cargar datos específicos de la sección si es necesario
    switch (section) {
      case 'roles':
        if (this.roles.length === 0) {
          this.loadRoles();
        }
        break;
      case 'classes':
        if (this.classes.length === 0) {
          this.loadClasses();
        }
        break;
      case 'teams':
        if (this.teams.length === 0) {
          this.loadTeams();
        }
        break;
      case 'assignments':
        if (this.assignments.length === 0) {
          this.loadAssignments();
        }
        break;
      case 'submissions':
        if (this.submissions.length === 0) {
          this.loadSubmissions();
        }
        break;
      case 'evaluations':
        if (this.evaluations.length === 0) {
          this.loadEvaluations();
        }
        break;
      case 'feedback':
        if (this.feedbacks.length === 0) {
          this.loadFeedback();
        }
        break;
    }
  }

  async loadRoles() {
    try {
      this.loading = true;
      this.roles = await this.apiService.getRoles().toPromise() || [];
      console.log('Roles cargados:', this.roles.length);
    } catch (error) {
      console.error('Error cargando roles:', error);
      this.showNotification('Error al cargar roles: ' + (error as Error).message, 'error');
    } finally {
      this.loading = false;
    }
  }

  async loadTeams() {
    try {
      this.loading = true;
      this.teams = await this.apiService.getTeams().toPromise() || [];
      console.log('Equipos cargados:', this.teams.length);
    } catch (error) {
      console.error('Error cargando equipos:', error);
      this.showNotification('Error al cargar equipos: ' + (error as Error).message, 'error');
    } finally {
      this.loading = false;
    }
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

  async loadAssignments() {
    try {
      this.loading = true;
      this.assignments = await this.apiService.getAssignments().toPromise() || [];
      console.log('Asignaciones cargadas:', this.assignments.length);
    } catch (error) {
      console.error('Error cargando asignaciones:', error);
      this.showNotification('Error al cargar asignaciones: ' + (error as Error).message, 'error');
    } finally {
      this.loading = false;
    }
  }

  async loadSubmissions() {
    try {
      this.loading = true;
      this.submissions = await this.apiService.getSubmissions().toPromise() || [];
      console.log('Entregas cargadas:', this.submissions.length);
    } catch (error) {
      console.error('Error cargando entregas:', error);
      this.showNotification('Error al cargar entregas: ' + (error as Error).message, 'error');
    } finally {
      this.loading = false;
    }
  }

  async loadEvaluations() {
    try {
      this.loading = true;
      this.evaluations = await this.apiService.getEvaluations().toPromise() || [];
      console.log('Evaluaciones cargadas:', this.evaluations.length);
    } catch (error) {
      console.error('Error cargando evaluaciones:', error);
      this.showNotification('Error al cargar evaluaciones: ' + (error as Error).message, 'error');
    } finally {
      this.loading = false;
    }
  }

  async loadFeedback() {
    try {
      this.loading = true;
      this.feedbacks = await this.apiService.getFeedbacks().toPromise() || [];
      console.log('Retroalimentación cargada:', this.feedbacks.length);
    } catch (error) {
      console.error('Error cargando retroalimentación:', error);
      this.showNotification('Error al cargar retroalimentación: ' + (error as Error).message, 'error');
    } finally {
      this.loading = false;
    }
  }

  async refreshData() {
    console.log('Refrescando todos los datos...');
    await this.loadInitialData();
    this.showNotification('Datos actualizados correctamente', 'success');
  }

  showNotification(message: string, type: 'success' | 'error' = 'success') {
    this.toastMessage = message;
    this.toastClass = type === 'error' ? 'bg-danger' : 'bg-success';

    // Mostrar toast usando Bootstrap
    setTimeout(() => {
      const toastElement = document.getElementById('notification-toast');
      if (toastElement) {
        const toast = new bootstrap.Toast(toastElement);
        toast.show();
      }
    }, 100);
  }

  getSectionTitle(section: string): string {
    const titles: { [key: string]: string } = {
      'roles': 'Gestión de Roles',
      'users': 'Gestión de Usuarios',
      'classes': 'Gestión de Clases',
      'teams': 'Gestión de Equipos',
      'assignments': 'Gestión de Asignaciones',
      'submissions': 'Gestión de Entregas',
      'evaluations': 'Gestión de Evaluaciones',
      'feedback': 'Gestión de Retroalimentación'
    };
    return titles[section] || 'Sección';
  }
}
