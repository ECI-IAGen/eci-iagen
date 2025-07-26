import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
      <div class="container-fluid">
        <a class="navbar-brand d-flex align-items-center" href="#">
          <i class="fas fa-graduation-cap me-2"></i>
          <span>ECI IAGen - Sistema Educativo</span>
        </a>
        
        <div class="navbar-nav ms-auto">
          <button 
            class="btn btn-outline-light btn-sm d-flex align-items-center" 
            (click)="onRefresh()" 
            title="Actualizar datos"
            [disabled]="isRefreshing">
            <i class="fas" [ngClass]="{'fa-sync-alt': !isRefreshing, 'fa-spinner fa-spin': isRefreshing}" me-2></i>
            <span class="ms-1 d-none d-md-inline">{{ isRefreshing ? 'Actualizando...' : 'Actualizar' }}</span>
          </button>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar-brand {
      font-weight: 600;
      font-size: 1.25rem;
    }
    
    .navbar-brand i {
      font-size: 1.5rem;
    }
    
    .btn-outline-light:hover {
      transform: translateY(-1px);
      transition: transform 0.2s ease;
    }
    
    .btn:disabled {
      transform: none;
    }
    
    @media (max-width: 768px) {
      .navbar-brand span {
        font-size: 1rem;
      }
    }
  `]
})
export class NavbarComponent {
  @Output() refresh = new EventEmitter<void>();
  
  isRefreshing = false;

  onRefresh() {
    this.isRefreshing = true;
    this.refresh.emit();
    
    // Simular el tiempo de actualización
    setTimeout(() => {
      this.isRefreshing = false;
    }, 1000);
  }
}
