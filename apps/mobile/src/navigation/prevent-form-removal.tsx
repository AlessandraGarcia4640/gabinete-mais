import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useIsFocused, useNavigation, usePreventRemove } from '@react-navigation/native';
import { useFormNavigationRequest } from './form-navigation-context';

function entryIndex(entry: object): number | undefined {
  return 'index' in entry && typeof entry.index === 'number' ? entry.index : undefined;
}

export function PreventFormRemoval({ dirty, onAttempt }: {
  dirty: boolean; onAttempt: (proceed: () => void) => void;
}) {
  const navigation = useNavigation();
  const focused = useIsFocused();
  const request = useFormNavigationRequest();
  const approvedDestination = useRef<number | undefined>(undefined);
  usePreventRemove(dirty, ({ data: { action } }) => onAttempt(() => navigation.dispatch(action)));

  useEffect(() => {
    if (!request || !dirty || !focused) return;
    request.current = onAttempt;
    return () => { if (request.current === onAttempt) request.current = null; };
  }, [request, dirty, focused, onAttempt]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !dirty || !focused || !('navigation' in window)) return;
    const browser = window.navigation;
    if (!(browser instanceof EventTarget)) return;

    const preventTraversal = (event: Event) => {
      // Browser history can restore another tab directly, without removing the form's route.
      if (!event.cancelable || !('navigationType' in event) || event.navigationType !== 'traverse') return;
      if (!('destination' in event) || !event.destination || typeof event.destination !== 'object') return;
      if (!('sameDocument' in event.destination) || !event.destination.sameDocument) return;
      const destination = entryIndex(event.destination);
      if (destination === undefined) return;
      if (approvedDestination.current === destination) { approvedDestination.current = undefined; return; }
      if (!('currentEntry' in browser) || !browser.currentEntry || typeof browser.currentEntry !== 'object') return;
      const current = entryIndex(browser.currentEntry);
      if (current === undefined || current === destination) return;
      event.preventDefault();
      onAttempt(() => {
        approvedDestination.current = destination;
        window.history.go(destination - current);
      });
    };

    browser.addEventListener('navigate', preventTraversal);
    return () => browser.removeEventListener('navigate', preventTraversal);
  }, [dirty, focused, onAttempt]);

  return null;
}
