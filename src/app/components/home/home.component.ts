import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div style="padding: 20px; text-align: center;">
      <h1>¡Bienvenido al Sistema ECI IAGen!</h1>
      <p>Si puedes ver este mensaje, la aplicación está funcionando correctamente.</p>
      <div style="margin-top: 20px;">
        <button routerLink="/chat" style="margin: 10px; padding: 10px 20px;">Ir al Chat</button>
        <button routerLink="/data-administration" style="margin: 10px; padding: 10px 20px;">Administración</button>
      </div>
    </div>
  `,
  styles: [`
    div {
      font-family: Arial, sans-serif;
    }
    h1 {
      color: #2c3e50;
    }
    button {
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
    }
    button:hover {
      background-color: #0056b3;
    }
  `]
})
export class HomeComponent {
}
