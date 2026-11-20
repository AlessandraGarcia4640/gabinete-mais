import type { PropsWithChildren } from 'react';
import { AppText } from './app-text';

export function Overline({ children }: PropsWithChildren) {
  return <AppText variant="overline" color="inkMuted" accessibilityRole="header">{children}</AppText>;
}
