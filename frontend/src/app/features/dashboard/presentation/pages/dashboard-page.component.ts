import { Component } from '@angular/core';

type MetricCard = {
  label: string;
  value: string;
  trend: string;
};

type ModuleCard = {
  title: string;
  copy: string;
  accent: 'gold' | 'blue' | 'green' | 'red';
};

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
})
export class DashboardPageComponent {
  protected readonly metrics: MetricCard[] = [
    { label: 'Equipos conectados', value: '12', trend: '+4 esta semana' },
    { label: 'Jugadores registrados', value: '186', trend: 'Base inicial del torneo' },
    { label: 'Torneos activos', value: '3', trend: '1 proximo a iniciar' },
  ];

  protected readonly modules: ModuleCard[] = [
    {
      title: 'Torneos',
      copy: 'Estados, inscripciones y control operativo del calendario competitivo.',
      accent: 'gold',
    },
    {
      title: 'Equipos',
      copy: 'Gestion centralizada de clubes, cupos y relacion con jugadores.',
      accent: 'blue',
    },
    {
      title: 'Jugadores',
      copy: 'Registro, trazabilidad y validaciones por dorsal y equipo.',
      accent: 'green',
    },
    {
      title: 'Arbitros',
      copy: 'Administracion del staff arbitral y expansion futura por asignaciones.',
      accent: 'red',
    },
  ];

  protected readonly roadmap = [
    'Conectar Angular con la API del backend mediante HttpClient y configuracion centralizada.',
    'Construir los modulos CRUD con formularios reactivos y validaciones alineadas al dominio.',
    'Escalar la base hacia partidos, tablas de posiciones, calendario y reportes.',
  ];
}
