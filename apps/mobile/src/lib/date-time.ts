const date = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short' });
const time = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', timeStyle: 'short' });

export function formatRecordDate(value: string) {
  return date.format(new Date(value));
}

export function formatRecordTime(value: string) {
  return time.format(new Date(value));
}
