import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { appSettings } from '../../core/config/app-settings';

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
      label: 'Panel',
      route: '/dashboard',
      description: 'Panorama general de la competencia',
    },
    {
      label: 'Equipos',
      route: '/teams',
      description: 'Clubes, ciudades y estadios',
    },
    {
      label: 'Jugadores',
      route: '/players',
      description: 'Plantillas, dorsales y posiciones',
    },
    {
      label: 'Arbitros',
      route: '/referees',
      description: 'Cuerpo arbitral y nacionalidades',
    },
    {
      label: 'Partidos',
      route: '/matches',
      description: 'Programacion, estados y marcadores',
    },
    {
      label: 'Torneos',
      route: '/tournaments',
      description: 'Temporadas, estados e inscripciones',
    },
    {
      label: 'Sponsors',
      route: '/sponsors',
      description: 'Patrocinadores, categorias y contratos',
    },
  ];

  protected readonly currentSeason = appSettings.currentSeason;
}
