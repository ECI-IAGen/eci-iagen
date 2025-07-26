import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sidebar-container">
      <div class="card border-0 shadow-sm">
        <div class="card-header bg-light border-bottom">
          <h6 class="card-title mb-0 d-flex align-items-center">
            <i class="fas fa-list me-2 text-primary"></i>
            Navegación
          </h6>
        </div>
        <div class="list-group list-group-flush">
          <button 
            *ngFor="let item of menuItems" 
            type="button"
            class="list-group-item list-group-item-action border-0 d-flex align-items-center"
            [class.active]="currentSection === item.id"
            [class.disabled]="item.disabled"
            (click)="onSectionSelect(item.id)"
            [disabled]="item.disabled">
            <i class="{{item.icon}} me-3 text-muted" [class.text-white]="currentSection === item.id"></i>
            <span>{{item.label}}</span>
            <span *ngIf="item.disabled" class="badge bg-secondary ms-auto">Próximamente</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .sidebar-container {
      position: sticky;
      top: 1rem;
      height: fit-content;
    }
    
    .card {
      border-radius: 0.5rem;
    }
    
    .card-header {
      padding: 1rem;
      border-radius: 0.5rem 0.5rem 0 0 !important;
    }
    
    .card-title {
      font-weight: 600;
      color: #495057;
    }
    
    .list-group-item {
      padding: 0.875rem 1rem;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none !important;
    }
    
    .list-group-item:hover:not(.disabled):not(.active) {
      background-color: #f8f9fa;
      transform: translateX(4px);
    }
    
    .list-group-item.active {
      background-color: #0d6efd;
      border-color: #0d6efd;
      color: white;
      font-weight: 500;
    }
    
    .list-group-item.disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .list-group-item i {
      width: 1.25rem;
      text-align: center;
    }
    
    .badge {
      font-size: 0.7rem;
    }
    
    @media (max-width: 768px) {
      .sidebar-container {
        position: static;
        margin-bottom: 1rem;
      }
      
      .list-group-item:hover:not(.disabled):not(.active) {
        transform: none;
      }
    }
  `]
})
export class SidebarComponent {
  @Input() currentSection = '';
  @Output() sectionChange = new EventEmitter<string>();

  menuItems: SidebarItem[] = [
    {
      id: 'roles',
      label: 'Roles',
      icon: 'fas fa-user-tag'
    },
    {
      id: 'users',
      label: 'Usuarios',
      icon: 'fas fa-users'
    },
    {
      id: 'classes',
      label: 'Clases',
      icon: 'fas fa-chalkboard'
    },
    {
      id: 'teams',
      label: 'Equipos',
      icon: 'fas fa-user-group'
    },
    {
      id: 'assignments',
      label: 'Asignaciones',
      icon: 'fas fa-tasks'
    },
    {
      id: 'submissions',
      label: 'Entregas',
      icon: 'fas fa-file-upload'
    },
    {
      id: 'evaluations',
      label: 'Evaluaciones',
      icon: 'fas fa-star'
    },
    {
      id: 'feedback',
      label: 'Retroalimentación',
      icon: 'fas fa-comments'
    }
  ];

  onSectionSelect(sectionId: string) {
    this.sectionChange.emit(sectionId);
  }
}
