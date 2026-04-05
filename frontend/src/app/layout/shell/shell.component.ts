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
      label: 'Panel',
      route: '/dashboard',
      description: 'Vision general de la operacion',
    },
    {
      label: 'Equipos',
      route: '/teams',
      description: 'Clubes, sedes e identidad competitiva',
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
      description: 'Calendario, estados y marcadores',
    },
    {
      label: 'Torneos',
      route: '/tournaments',
      description: 'Temporadas, estados e inscripciones',
    },
    {
      label: 'Sponsor',
      route: '/sponsors',
      description: 'Sponsors, categorias y acuerdos',
    },
  ];
}
