import { useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSession, useSessionManager } from '../../providers/session-provider';
import { HttpAuthApi } from '../auth/api';
import { DashboardApi } from './api';
import { gabineteDate } from './model';
export function useGabineteDate() {
  const [day, setDay] = useState(() => gabineteDate());
  useEffect(() => {
    const update = () => setDay(gabineteDate()); const timer = setInterval(update, 60000);
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') update(); });
    return () => { clearInterval(timer); subscription.remove(); };
  }, []); return day;
}
export function useDashboardApi() {
  const manager = useSessionManager();
  return useMemo(() => new DashboardApi(new HttpAuthApi(manager.apiUrl), manager), [manager]);
}
export function useDashboardQueries(day: string) {
  const api = useDashboardApi(); const { user } = useSession(); const assigneeId = user?.id ?? '';
  const open = useQuery({ queryKey: ['tasks', 'preview', assigneeId, 'ABERTA', day], enabled: !!user, retry: false,
    queryFn: ({ signal }) => api.tasks({ status: 'ABERTA', assigneeId, limit: 5 }, signal) });
  const progress = useQuery({ queryKey: ['tasks', 'preview', assigneeId, 'EM_ANDAMENTO', day], enabled: !!user, retry: false,
    queryFn: ({ signal }) => api.tasks({ status: 'EM_ANDAMENTO', assigneeId, limit: 5 }, signal) });
  const routines = useQuery({ queryKey: ['routines', 'preview', day, assigneeId], enabled: !!user, retry: false,
    queryFn: ({ signal }) => api.routines({ scheduledFor: day, limit: 5 }, signal) });
  return { open, progress, routines };
}
