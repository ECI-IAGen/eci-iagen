import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../services/api.service';

declare var bootstrap: any;

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit {
  loading = false;
  users: any[] = [];
  roles: any[] = [];
  teams: any[] = [];
  
  // Toast
  toastMessage = '';
  toastClass = '';

  // Modal state
  showCreateModal = false;
  showEditModal = false;
  showViewModal = false;
  selectedUser: any = null;
  
  // Form data
  userForm = {
    name: '',
    email: '',
    roleId: '',
    teamIds: [] as number[]
  };

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadUsers();
    this.loadRolesAndTeams();
  }

  async loadUsers() {
    try {
      this.loading = true;
      this.users = await this.apiService.getUsers().toPromise() || [];
      console.log('Usuarios cargados:', this.users.length);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      this.showNotification('Error al cargar usuarios: ' + (error as Error).message, 'error');
    } finally {
      this.loading = false;
    }
  }

  async loadRolesAndTeams() {
    try {
      // Cargar roles y equipos para los modales
      this.roles = await this.apiService.getRoles().toPromise() || [];
      this.teams = await this.apiService.getTeams().toPromise() || [];
    } catch (error) {
      console.error('Error cargando roles y equipos:', error);
    }
  }

  showNotification(message: string, type: 'success' | 'error' = 'success') {
    this.toastMessage = message;
    this.toastClass = type === 'error' ? 'bg-danger' : 'bg-success';

    // Mostrar toast usando Bootstrap
    setTimeout(() => {
      const toastElement = document.getElementById('user-notification-toast');
      if (toastElement) {
        const toast = new bootstrap.Toast(toastElement);
        toast.show();
      }
    }, 100);
  }

  // Utilidades para el template
  trackByUserId(index: number, user: any): number {
    return user.id;
  }

  getRoleBadgeClass(roleName: string): string {
    switch (roleName?.toLowerCase()) {
      case 'admin':
      case 'administrador':
        return 'bg-danger';
      case 'profesor':
      case 'teacher':
        return 'bg-primary';
      case 'estudiante':
      case 'student':
        return 'bg-success';
      default:
        return 'bg-secondary';
    }
  }

  // Métodos para gestión de usuarios
  async viewUser(user: any) {
    try {
      // Cargar datos completos del usuario
      this.selectedUser = await this.apiService.getUserById(user.id).toPromise();
      this.showViewModal = true;
    } catch (error) {
      console.error('Error cargando detalles del usuario:', error);
      this.showNotification('Error al cargar detalles del usuario: ' + (error as Error).message, 'error');
    }
  }

  async openCreateUserModal() {
    this.resetForm();
    this.showCreateModal = true;
  }

  async openEditUserModal(user: any) {
    try {
      // Cargar datos completos del usuario
      this.selectedUser = await this.apiService.getUserById(user.id).toPromise();
      
      // Poblar el formulario con los datos del usuario
      this.userForm = {
        name: this.selectedUser.name || '',
        email: this.selectedUser.email || '',
        roleId: this.selectedUser.roleId || '',
        teamIds: this.selectedUser.teamIds || []
      };
      
      this.showEditModal = true;
    } catch (error) {
      console.error('Error cargando datos del usuario:', error);
      this.showNotification('Error al cargar datos del usuario: ' + (error as Error).message, 'error');
    }
  }

  async createUser() {
    try {
      const userData = {
        name: this.userForm.name,
        email: this.userForm.email || null,
        roleId: parseInt(this.userForm.roleId as string),
        teamIds: this.userForm.teamIds
      };

      await this.apiService.createUser(userData).toPromise();
      this.showCreateModal = false;
      this.showNotification('Usuario creado exitosamente');
      this.loadUsers();
      this.resetForm();
    } catch (error) {
      console.error('Error creando usuario:', error);
      this.showNotification('Error al crear usuario: ' + (error as Error).message, 'error');
    }
  }

  async updateUser() {
    try {
      const userData = {
        name: this.userForm.name,
        email: this.userForm.email || null,
        roleId: parseInt(this.userForm.roleId as string),
        teamIds: this.userForm.teamIds
      };

      await this.apiService.updateUser(this.selectedUser.id, userData).toPromise();
      this.showEditModal = false;
      this.showNotification('Usuario actualizado exitosamente');
      this.loadUsers();
      this.resetForm();
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      this.showNotification('Error al actualizar usuario: ' + (error as Error).message, 'error');
    }
  }

  async confirmDeleteUser(user: any) {
    if (confirm('¿Está seguro de que desea eliminar este usuario?')) {
      try {
        await this.apiService.deleteUser(user.id).toPromise();
        this.showNotification('Usuario eliminado exitosamente');
        this.loadUsers();
      } catch (error) {
        console.error('Error eliminando usuario:', error);
        this.showNotification('Error al eliminar usuario: ' + (error as Error).message, 'error');
      }
    }
  }

  resetForm() {
    this.userForm = {
      name: '',
      email: '',
      roleId: '',
      teamIds: []
    };
    this.selectedUser = null;
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
      if (!this.userForm.teamIds.includes(teamId)) {
        this.userForm.teamIds.push(teamId);
      }
    } else {
      this.userForm.teamIds = this.userForm.teamIds.filter(id => id !== teamId);
    }
  }

  isTeamSelected(teamId: number): boolean {
    return this.userForm.teamIds.includes(teamId);
  }

  getTeamNames(user: any): string {
    if (user.teamNames && user.teamNames.length > 0) {
      return user.teamNames.join(', ');
    }
    return 'Sin equipos';
  }

  // Método para descargar usuarios como CSV
  downloadUsers() {
    if (!this.users || this.users.length === 0) {
      this.showNotification('No hay usuarios para exportar.', 'error');
      return;
    }
    const columns = ['ID', 'Nombre', 'Email', 'Rol', 'Equipos'];
    const rows = this.users.map(u => [
      u.id,
      u.name,
      u.email || '',
      u.roleName || '',
      (u.teamNames || []).join(', ')
    ]);
    const csvContent = '\uFEFF' + [
      columns.join(','),
      ...rows.map(row => row.map(field => `"${(field + '').replace(/"/g, '""')}"`).join(','))
    ].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'usuarios.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    this.showNotification('Archivo CSV descargado correctamente.');
  }
}
