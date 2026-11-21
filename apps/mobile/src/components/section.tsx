import type { PropsWithChildren, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '../lib/theme';
import { AppText } from './app-text';

interface SectionProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function Section({ title, description, action, children }: PropsWithChildren<SectionProps>) {
  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <View style={styles.copy}>
          <AppText variant="title" accessibilityRole="header">{title}</AppText>
          {!!description && <AppText variant="caption" color="inkMuted">{description}</AppText>}
        </View>
        {action}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.space3 },
  heading: {
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.space3,
  },
  copy: { minWidth: 0, flexShrink: 1, gap: spacing.space1 },
});
