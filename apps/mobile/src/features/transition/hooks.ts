import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { TransitionQuery } from '@gabinete-plus/shared';
import { ApiFailure } from '../../lib/api-error';
import { strings } from '../../lib/strings';
import { useSession, useSessionManager } from '../../providers/session-provider';
import { HttpAuthApi } from '../auth/api';
import { TransitionApi } from './api';

export function useTransitionApi() {
  const manager = useSessionManager();
  return useMemo(() => new TransitionApi(new HttpAuthApi(manager.apiUrl), manager), [manager]);
}

export function useGuideSection(section: TransitionQuery['section']) {
  const api = useTransitionApi();
  const { user } = useSession();
  return useInfiniteQuery({
    queryKey: ['transition-guide', user?.id, section], enabled: !!user, retry: false, initialPageParam: '',
    queryFn: ({ pageParam, signal }) => api.read({ section, limit: 20, ...(pageParam ? { cursor: pageParam } : {}) }, signal),
    getNextPageParam: (page) => page.section.nextCursor || undefined,
  });
}

export function errorMessage(error: Error) {
  if (error instanceof ApiFailure) {
    if (error.code === 'TRANSITION_CONFLICT') return strings.transition.conflict;
    if (error.code === 'TRANSITION_TOO_LARGE') return strings.transition.tooLarge;
    if (error.code === 'TRANSITION_NOT_FOUND') return strings.transition.notFound;
    if (error.code === 'FORBIDDEN') return strings.transition.forbidden;
  }
  return strings.contacts.requestError;
}
