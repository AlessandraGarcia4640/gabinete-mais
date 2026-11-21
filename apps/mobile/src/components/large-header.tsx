import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '../lib/theme';
import { AppText } from './app-text';

interface LargeHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: ReactNode;
}

export function LargeHeader({ title, description, eyebrow, action }: LargeHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.copy}>
        {!!eyebrow && <AppText variant="overline" color="inkMuted">{eyebrow}</AppText>}
        <AppText variant="display" accessibilityRole="header">{title}</AppText>
        {!!description && <AppText variant="body" color="inkMuted">{description}</AppText>}
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center',
    gap: spacing.space4,
  },
  copy: { minWidth: 0, flexShrink: 1, gap: spacing.space2 },
});
