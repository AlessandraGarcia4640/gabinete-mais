import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { iconSize, line, radius, spacing } from '../lib/theme';
import { useTheme } from '../providers/theme-provider';
import { AppText } from './app-text';
import { IconButton } from './icon-button';

interface EditorAction {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

interface OrderedEditorProps {
  position: number;
  field: ReactNode;
  up: EditorAction;
  down: EditorAction;
  remove: EditorAction;
}

export function OrderedEditor({ position, field, up, down, remove }: OrderedEditorProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.borderStrong }]}>
      <View style={styles.content}>
        <AppText variant="data" color="inkMuted" style={styles.number}>{position}</AppText>
        <View style={styles.field}>{field}</View>
      </View>
      <View style={styles.actions}>
        <IconButton icon="arrow-up" {...up} />
        <IconButton icon="arrow-down" {...down} />
        <IconButton icon="x" color="danger" {...remove} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.space2,
    padding: spacing.space2, borderRadius: radius.md, borderWidth: line.control,
  },
  content: { flex: 1, minWidth: '55%', flexDirection: 'row', alignItems: 'center', gap: spacing.space2 },
  number: { minWidth: iconSize.standard, textAlign: 'center' },
  field: { flex: 1 },
  actions: { flexDirection: 'row', marginStart: 'auto' },
});
