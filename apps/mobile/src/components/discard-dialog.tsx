import { ScrollView, StyleSheet } from 'react-native';
import { strings } from '../lib/strings';
import { spacing } from '../lib/theme';
import { AppText } from './app-text';
import { Button } from './button';
import { Overlay, type OverlayVisibility } from './overlay';

interface DiscardDialogProps extends Omit<OverlayVisibility, 'title'> {
  onDiscard: () => void;
}

export function DiscardDialog({ onDiscard, onDismiss, ...visibility }: DiscardDialogProps) {
  return (
    <Overlay {...visibility} placement="dialog" title={strings.routines.unsavedTitle} onDismiss={onDismiss}>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="body" color="inkMuted">{strings.routines.unsavedDescription}</AppText>
        <Button label={strings.routines.continueEditing} onPress={onDismiss} />
        <Button label={strings.routines.discard} variant="dangerGhost" onPress={onDiscard} />
      </ScrollView>
    </Overlay>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.space3 },
});
