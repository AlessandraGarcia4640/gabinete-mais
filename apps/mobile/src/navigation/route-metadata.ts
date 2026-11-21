import type { Href } from 'expo-router';
import type { IconName } from '../components';
import { strings } from '../lib/strings';
import { breakpoint } from '../lib/theme';

type Primary = 'home' | 'tasks' | 'routines' | 'cabinet' | 'profile';
type Sidebar = Exclude<Primary, 'cabinet'> | 'checklists' | 'contacts' | 'guidelines' | 'transition';

export interface Destination {
  id: Primary | Sidebar;
  label: string;
  href: Href;
  icon: IconName;
}

const nav = strings.nav;

export const destinations: Record<Primary | Sidebar, Destination> = {
  home: { id: 'home', label: nav.home, href: '/', icon: 'home' },
  tasks: { id: 'tasks', label: nav.tasks, href: '/tarefas', icon: 'check-square' },
  routines: { id: 'routines', label: nav.routines, href: '/rotinas', icon: 'repeat' },
  cabinet: { id: 'cabinet', label: nav.cabinet, href: '/gabinete', icon: 'briefcase' },
  profile: { id: 'profile', label: nav.profile, href: '/perfil', icon: 'user' },
  checklists: { id: 'checklists', label: nav.checklists, href: '/checklists', icon: 'list' },
  contacts: { id: 'contacts', label: nav.contacts, href: '/contatos', icon: 'users' },
  guidelines: { id: 'guidelines', label: nav.guidelines, href: '/orientacoes', icon: 'book-open' },
  transition: { id: 'transition', label: nav.transition, href: '/transicao', icon: 'compass' },
};

export const primaryDestinations = [
  destinations.home, destinations.tasks, destinations.routines, destinations.cabinet, destinations.profile,
];

export const sidebarDestinations = [
  destinations.home, destinations.tasks, destinations.routines, destinations.checklists,
  destinations.contacts, destinations.guidelines, destinations.transition,
];

export const cabinetDestinations = [destinations.guidelines, destinations.contacts, destinations.transition];

export type RoutineView = '/rotinas' | '/checklists' | '/execucoes';

type RouteMetadata = {
  primary: Primary;
  sidebar?: Sidebar;
  top?: boolean;
  title?: string;
  backTo?: Href;
  split?: 'tasks' | 'guidelines';
  routineView?: RoutineView;
};

export function navigationPresentation(width: number): 'bar' | 'rail' | 'sidebar' {
  if (width >= breakpoint.large) return 'sidebar';
  return width >= breakpoint.medium ? 'rail' : 'bar';
}

export function routeMetadata(pathname: string): RouteMetadata {
  const [, root, child, action] = pathname.split('/');
  switch (root) {
    case '':
      return { primary: 'home', sidebar: 'home', top: true };
    case 'tarefas':
      return { primary: 'tasks', sidebar: 'tasks', top: true, split: 'tasks' };
    case 'tarefa':
      return {
        primary: 'tasks', sidebar: 'tasks', backTo: '/tarefas',
        split: child !== 'nova' && !action ? 'tasks' : undefined,
      };
    case 'rotinas':
      return { primary: 'routines', sidebar: 'routines', top: true, title: nav.routines, routineView: '/rotinas' };
    case 'rotina':
      return {
        primary: 'routines', sidebar: 'routines', backTo: '/rotinas',
        title: child === 'nova' ? strings.routines.create : action === 'editar' ? strings.routines.edit : undefined,
      };
    case 'checklists':
      return { primary: 'routines', sidebar: 'checklists', top: true, title: strings.checklists.models, routineView: '/checklists' };
    case 'execucoes':
      return { primary: 'routines', sidebar: 'checklists', top: true, title: strings.checklists.history, routineView: '/execucoes' };
    case 'checklist':
      return {
        primary: 'routines', sidebar: 'checklists', backTo: '/checklists',
        title: child === 'nova' ? strings.checklists.create : action === 'editar' ? strings.checklists.edit : strings.checklists.detail,
      };
    case 'execucao':
      return { primary: 'routines', sidebar: 'checklists', backTo: '/execucoes', title: strings.checklists.run };
    case 'gabinete':
      return { primary: 'cabinet', top: true };
    case 'contatos':
      return { primary: 'cabinet', sidebar: 'contacts', backTo: '/gabinete', title: nav.contacts };
    case 'contato':
      return {
        primary: 'cabinet', sidebar: 'contacts', backTo: '/contatos',
        title: child === 'novo' ? strings.contacts.create : action === 'editar' ? strings.contacts.edit : strings.contacts.details,
      };
    case 'orientacoes':
      return {
        primary: 'cabinet', sidebar: 'guidelines', backTo: '/gabinete',
        title: nav.guidelines, split: 'guidelines',
      };
    case 'orientacao':
      return {
        primary: 'cabinet', sidebar: 'guidelines', backTo: '/orientacoes',
        title: child === 'nova' ? strings.guidelines.create : action === 'editar'
          ? strings.guidelines.edit : action === 'versoes' ? strings.guidelines.history : nav.guidelines,
        split: child !== 'nova' && !action ? 'guidelines' : undefined,
      };
    case 'transicao':
      return {
        primary: 'cabinet', sidebar: 'transition', backTo: child ? '/transicao' : '/gabinete',
        title: child === 'preparar' ? strings.transition.curate : child ? strings.transition.copies : nav.transition,
      };
    case 'perfil':
      return { primary: 'profile', sidebar: 'profile', top: true };
    default:
      return { primary: 'home', sidebar: 'home' };
  }
}
