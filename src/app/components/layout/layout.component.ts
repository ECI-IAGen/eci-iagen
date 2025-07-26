import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, NavbarComponent, SidebarComponent],
  template: `
    <!-- Navbar -->
    <app-navbar (refresh)="onRefresh()"></app-navbar>
    
    <!-- Main Content Area -->
    <div class="main-wrapper">
      <div class="container-fluid mt-4">
        <div class="row">
          <!-- Sidebar -->
          <div class="col-lg-3 col-md-4">
            <app-sidebar 
              [currentSection]="currentSection"
              (sectionChange)="onSectionChange($event)">
            </app-sidebar>
          </div>
          
          <!-- Content Area -->
          <div class="col-lg-9 col-md-8">
            <div class="content-area">
              <ng-content></ng-content>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Floating Refresh Button (only on mobile) -->
    <button 
      class="btn btn-primary floating-refresh d-md-none"
      (click)="onRefresh()"
      title="Actualizar datos">
      <i class="fas fa-sync-alt"></i>
    </button>
  `,
  styles: [`
    .main-wrapper {
      min-height: calc(100vh - 76px);
      background-color: #f8f9fa;
    }
    
    .content-area {
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
      padding: 0;
      min-height: 500px;
    }
    
    .floating-refresh {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 1000;
      border-radius: 50%;
      width: 56px;
      height: 56px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .floating-refresh:hover {
      transform: scale(1.05);
      transition: transform 0.2s ease;
    }
    
    @media (max-width: 768px) {
      .main-wrapper .container-fluid {
        padding: 1rem 0.5rem;
      }
      
      .content-area {
        margin-top: 1rem;
      }
    }
    
    @media (min-width: 769px) {
      .floating-refresh {
        display: none !important;
      }
    }
  `]
})
export class LayoutComponent {
  @Input() currentSection = '';
  @Output() refresh = new EventEmitter<void>();
  @Output() sectionChange = new EventEmitter<string>();

  onRefresh() {
    this.refresh.emit();
  }

  onSectionChange(section: string) {
    this.sectionChange.emit(section);
  }
}
