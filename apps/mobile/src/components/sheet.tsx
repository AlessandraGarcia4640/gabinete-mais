import type { PropsWithChildren } from 'react';
import { strings } from '../lib/strings';
import { IconButton } from './icon-button';
import { Overlay, type OverlayVisibility } from './overlay';

export function Sheet({ children, onDismiss, ...visibility }: PropsWithChildren<OverlayVisibility>) {
  return (
    <Overlay
      {...visibility}
      placement="sheet"
      onDismiss={onDismiss}
      headerAction={<IconButton label={strings.nav.close} icon="x" onPress={onDismiss} />}
    >
      {children}
    </Overlay>
  );
}
