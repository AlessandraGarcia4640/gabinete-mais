import { gabineteDate, pendingPreview, previousDay } from './model';
import { taskFixture } from './fixtures.test-helper';
it('data do gabinete respeita mudança de dia em São Paulo, não UTC do aparelho', () => {
  expect(gabineteDate(new Date('2026-10-12T01:00:00Z'))).toBe('2026-10-11'); expect(gabineteDate(new Date('2026-10-12T03:00:00Z'))).toBe('2026-10-12');
});
it('calcula a véspera na virada de mês e ano', () => {
  expect(previousDay('2026-01-01')).toBe('2025-12-31');
  expect(previousDay('2028-03-01')).toBe('2028-02-29');
});
it('combina status por prazo e prioridade, deixando sem prazo ao final', () => {
  const normal = taskFixture({ id: 'normal', dueDate: '2026-10-12' }); const urgent = taskFixture({ id: 'urgent', priority: 'URGENTE', dueDate: '2026-10-12', status: 'EM_ANDAMENTO' });
  const undated = taskFixture({ id: 'undated', priority: 'URGENTE' });
  expect(pendingPreview([normal, undated], [urgent], 'actor').map((row) => row.id)).toEqual(['urgent', 'normal', 'undated']);
});
it('limita prévia, elimina repetição e não mistura tarefas de outra pessoa ou encerradas', () => {
  const open = Array.from({ length: 7 }, (_, i) => taskFixture({ id: `task-${String(i)}` }));
  const duplicate = open[0]; if (!duplicate) throw new Error('Fixture ausente.');
  const progress = [duplicate, taskFixture({ id: 'other', assigneeId: 'other' }), taskFixture({ id: 'closed', status: 'CANCELADA' })];
  expect(pendingPreview(open, progress, 'actor')).toHaveLength(5); expect(pendingPreview([], progress, 'actor').map((row) => row.id)).toEqual([duplicate.id]);
});
