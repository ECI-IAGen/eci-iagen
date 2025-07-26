import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="component-container">
      <div class="section-header">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h2 class="section-title">
              <i class="fas fa-comments me-2"></i>Gestión de Retroalimentación
            </h2>
            <p class="section-subtitle text-muted">Administra la retroalimentación y comentarios del sistema</p>
          </div>
          <div class="section-actions">
            <button class="btn btn-outline-primary me-2" (click)="loadFeedback()">
              <i class="fas fa-refresh me-2"></i>Recargar
            </button>
            <button class="btn btn-primary" (click)="createFeedback()">
              <i class="fas fa-plus me-2"></i>Nueva Retroalimentación
            </button>
          </div>
        </div>
      </div>
      
      <div class="section-body">
        <div class="coming-soon-container">
          <div class="text-center py-5">
            <div class="coming-soon-icon mb-4">
              <i class="fas fa-comments text-primary"></i>
            </div>
            <h4 class="text-primary mb-3">Componente Retroalimentación</h4>
            <p class="text-muted mb-4">Este componente está listo para implementar la funcionalidad de gestión de retroalimentación</p>
            <div class="feature-list">
              <div class="feature-item">
                <i class="fas fa-check text-success me-2"></i>
                <span>Listar retroalimentaciones existentes</span>
              </div>
              <div class="feature-item">
                <i class="fas fa-check text-success me-2"></i>
                <span>Crear nueva retroalimentación</span>
              </div>
              <div class="feature-item">
                <i class="fas fa-check text-success me-2"></i>
                <span>Responder a comentarios</span>
              </div>
              <div class="feature-item">
                <i class="fas fa-check text-success me-2"></i>
                <span>Generar reportes de feedback</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .component-container {
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
      overflow: hidden;
    }
    
    .section-header {
      padding: 1.5rem;
      border-bottom: 1px solid #dee2e6;
      background-color: #f8f9fa;
    }
    
    .section-title {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #212529;
    }
    
    .section-subtitle {
      margin: 0.5rem 0 0 0;
      font-size: 0.9rem;
    }
    
    .section-body {
      padding: 2rem;
    }
    
    .coming-soon-icon {
      font-size: 4rem;
    }
    
    .feature-list {
      text-align: left;
      display: inline-block;
    }
    
    .feature-item {
      display: flex;
      align-items: center;
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
    }
    
    @media (max-width: 768px) {
      .section-header {
        padding: 1rem;
      }
      
      .section-actions {
        flex-direction: column;
        gap: 0.5rem;
      }
      
      .section-actions .btn {
        width: 100%;
        margin: 0 !important;
      }
    }
  `]
})
export class FeedbackComponent {
  
  constructor() {}
  
  loadFeedback() {
    console.log('Cargando retroalimentación...');
    // Aquí se implementará la lógica para cargar retroalimentación
  }
  
  createFeedback() {
    console.log('Creando nueva retroalimentación...');
    // Aquí se implementará la lógica para crear nueva retroalimentación
  }
}
