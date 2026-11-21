import type { Href } from 'expo-router';
import type { transitionGuideSchema, Task } from '@gabinete-plus/shared';
import type { z } from 'zod';
import type { IconName } from '../../components';
import { strings } from '../../lib/strings';
import { displayDate } from '../dashboard/model';

const copy = strings.transition;
type GuideSection = z.infer<typeof transitionGuideSchema>['section'];
export type TransitionRow = { id: string; title: string; description: string; href: Href; icon?: IconName; details: () => string; task?: Pick<Task, 'isOverdue' | 'status'> };

export function transitionRows(section: GuideSection): TransitionRow[] {
  switch (section.kind) {
    case 'ROUTINES':
      return section.items.map((item) => ({
        id: item.id, title: item.title, description: strings.routines.metadata(strings.dashboard.frequency[item.frequency], item.category),
        href: { pathname: '/rotina/[id]', params: { id: item.id } }, icon: 'repeat',
        details: () => [item.description, item.instructions, ...item.steps.map((step) => `- ${step}`)].filter(Boolean).join('\n\n'),
      }));
    case 'GUIDELINES':
      return section.items.map((item) => ({
        id: item.id, title: item.title, description: strings.routines.metadata(strings.guidelines.categories[item.category], strings.guidelines.version(item.version)),
        href: { pathname: '/orientacao/[id]', params: { id: item.id } }, icon: 'book-open',
        details: () => [item.authorName, item.content].filter(Boolean).join('\n\n'),
      }));
    case 'CONTACTS':
      return section.items.map((item) => ({
        id: item.id, title: item.name, description: item.jobTitle ? strings.routines.metadata(item.organization, item.jobTitle) : item.organization,
        href: { pathname: '/contato/[id]', params: { id: item.id } },
        details: () => [...item.phones, item.email, item.notes].filter(Boolean).join('\n\n'),
      }));
    case 'TASKS':
      return section.items.map((item) => ({
        id: item.id, title: item.title,
        description: copy.taskMetadata(item.assigneeName, item.dueDate
          ? displayDate(item.dueDate, { day: '2-digit', month: '2-digit' }) : strings.contacts.noInformation),
        href: { pathname: '/tarefa/[id]', params: { id: item.id } }, icon: 'check-square', task: item,
        details: () => [item.description, item.instructions].filter(Boolean).join('\n\n'),
      }));
  }
}
