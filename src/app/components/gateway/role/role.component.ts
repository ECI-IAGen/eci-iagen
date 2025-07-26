import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';

declare var bootstrap: any;

@Component({
  selector: 'app-role',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './role.component.html',
  styleUrls: ['./role.component.css']
})
export class RoleComponent implements OnInit {
  loading = false;
  roles: any[] = [];
  
  // Toast
  toastMessage = '';
  toastClass = '';

  // Modal state
  showCreateModal = false;
  showEditModal = false;
  showViewModal = false;
  selectedRole: any = null;
  
  // Form data
  roleForm = {
    name: ''
  };

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadRoles();
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

  showNotification(message: string, type: 'success' | 'error' = 'success') {
    this.toastMessage = message;
    this.toastClass = type === 'error' ? 'bg-danger' : 'bg-success';

    // Mostrar toast usando Bootstrap
    setTimeout(() => {
      const toastElement = document.getElementById('role-notification-toast');
      if (toastElement) {
        const toast = new bootstrap.Toast(toastElement);
        toast.show();
      }
    }, 100);
  }

  // Utilidades para el template
  trackByRoleId(index: number, role: any): number {
    return role.id;
  }

  // Métodos para gestión de roles
  async viewRole(role: any) {
    try {
      // Cargar datos completos del rol
      this.selectedRole = await this.apiService.getRoleById(role.id).toPromise();
      this.showViewModal = true;
    } catch (error) {
      console.error('Error cargando detalles del rol:', error);
      this.showNotification('Error al cargar detalles del rol: ' + (error as Error).message, 'error');
    }
  }

  async openCreateRoleModal() {
    this.resetForm();
    this.showCreateModal = true;
  }

  async openEditRoleModal(role: any) {
    try {
      // Cargar datos completos del rol
      this.selectedRole = await this.apiService.getRoleById(role.id).toPromise();
      
      // Poblar el formulario con los datos del rol
      this.roleForm = {
        name: this.selectedRole.name || ''
      };
      
      this.showEditModal = true;
    } catch (error) {
      console.error('Error cargando datos del rol:', error);
      this.showNotification('Error al cargar datos del rol: ' + (error as Error).message, 'error');
    }
  }

  async createRole() {
    try {
      const roleData = {
        name: this.roleForm.name
      };

      await this.apiService.createRole(roleData).toPromise();
      this.showCreateModal = false;
      this.showNotification('Rol creado exitosamente');
      this.loadRoles();
      this.resetForm();
    } catch (error) {
      console.error('Error creando rol:', error);
      this.showNotification('Error al crear rol: ' + (error as Error).message, 'error');
    }
  }

  async updateRole() {
    try {
      const roleData = {
        name: this.roleForm.name
      };

      await this.apiService.updateRole(this.selectedRole.id, roleData).toPromise();
      this.showEditModal = false;
      this.showNotification('Rol actualizado exitosamente');
      this.loadRoles();
      this.resetForm();
    } catch (error) {
      console.error('Error actualizando rol:', error);
      this.showNotification('Error al actualizar rol: ' + (error as Error).message, 'error');
    }
  }

  async confirmDeleteRole(role: any) {
    if (confirm('¿Está seguro de que desea eliminar este rol?')) {
      try {
        await this.apiService.deleteRole(role.id).toPromise();
        this.showNotification('Rol eliminado exitosamente');
        this.loadRoles();
      } catch (error) {
        console.error('Error eliminando rol:', error);
        this.showNotification('Error al eliminar rol: ' + (error as Error).message, 'error');
      }
    }
  }

  resetForm() {
    this.roleForm = {
      name: ''
    };
    this.selectedRole = null;
  }

  closeModal() {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.showViewModal = false;
    this.resetForm();
  }
}
