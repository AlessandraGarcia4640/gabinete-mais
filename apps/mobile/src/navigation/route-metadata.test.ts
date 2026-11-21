import { navigationPresentation, routeMetadata } from './route-metadata';

it.each([
  [390, 'bar'], [599, 'bar'], [600, 'rail'], [834, 'rail'], [1199, 'rail'], [1200, 'sidebar'], [1360, 'sidebar'],
])('escolhe %s px como apresentação %s', (width, expected) => {
  expect(navigationPresentation(width)).toBe(expected);
});

it.each([
  ['/checklists', 'routines', 'checklists'], ['/execucoes', 'routines', 'checklists'],
  ['/checklist/modelo/editar', 'routines', 'checklists'], ['/execucao/periodo', 'routines', 'checklists'],
  ['/contato/pessoa/editar', 'cabinet', 'contacts'], ['/orientacao/texto/versoes', 'cabinet', 'guidelines'],
  ['/transicao/copia/registro', 'cabinet', 'transition'], ['/tarefa/registro/historico', 'tasks', 'tasks'],
])('associa %s aos destinos adequados', (pathname, primary, sidebar) => {
  expect(routeMetadata(pathname)).toMatchObject({ primary, sidebar });
});

it('divide somente listas e leituras e conserva o destino de retorno', () => {
  expect(routeMetadata('/tarefas')).toMatchObject({ top: true, split: 'tasks' });
  expect(routeMetadata('/tarefa/registro')).toMatchObject({ split: 'tasks', backTo: '/tarefas' });
  expect(routeMetadata('/tarefa/registro/editar')).toMatchObject({ split: undefined, backTo: '/tarefas' });
  expect(routeMetadata('/orientacoes')).toMatchObject({ split: 'guidelines' });
  expect(routeMetadata('/orientacao/texto')).toMatchObject({ split: 'guidelines', backTo: '/orientacoes' });
  expect(routeMetadata('/orientacao/nova')).toMatchObject({ split: undefined, backTo: '/orientacoes' });
});
