import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

type NavigationItem = {
  label: string;
  route: string;
  description: string;
};

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  protected readonly navigation: NavigationItem[] = [
    {
      label: 'Dashboard',
      route: '/dashboard',
      description: 'Resumen general de la liga',
    },
    {
      label: 'Equipos',
      route: '/teams',
      description: 'Gestion de clubes y plantillas',
    },
    {
      label: 'Jugadores',
      route: '/players',
      description: 'Registro y seguimiento de atletas',
    },
    {
      label: 'Arbitros',
      route: '/referees',
      description: 'Administracion del cuerpo arbitral',
    },
    {
      label: 'Torneos',
      route: '/tournaments',
      description: 'Planificacion y control competitivo',
    },
  ];

  protected readonly quickStats = [
    { label: 'Temporada activa', value: '2026' },
    { label: 'Modulo inicial', value: 'Dashboard' },
    { label: 'Modo de trabajo', value: 'Responsive' },
  ];
}
