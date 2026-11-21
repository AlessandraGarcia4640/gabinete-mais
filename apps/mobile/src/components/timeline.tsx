import { StyleSheet, View } from 'react-native';
import { dimensions, iconSize, line, radius, spacing } from '../lib/theme';
import { useTheme } from '../providers/theme-provider';
import { AppText } from './app-text';
import { Icon, type IconName } from './icon';

interface Entry {
  id: string;
  title: string;
  detail: string;
  time: string;
  icon: IconName;
}

export function Timeline({ entries }: { entries: readonly Entry[] }) {
  return (
    <View>
      {entries.map(({ id, ...entry }, index) => (
        <TimelineEntry key={id} {...entry} first={index === 0} last={index === entries.length - 1} />
      ))}
    </View>
  );
}

export function TimelineEntry({ title, detail, time, icon, first, last }: Omit<Entry, 'id'> & { first: boolean; last: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View style={styles.leading}>
        <View style={[styles.marker, { backgroundColor: first ? colors.brandSoft : colors.surfaceSunken }]}>
          <Icon name={icon} size={iconSize.small} color={first ? 'brandText' : 'inkMuted'} />
        </View>
        {!last && <View style={[styles.connection, { backgroundColor: colors.border }]} />}
      </View>
      <View style={[styles.content, last && styles.last]}>
        <AppText variant="bodyStrong">{title}</AppText>
        <AppText variant="label" color="inkMuted">{detail}</AppText>
        <AppText variant="data" color="inkMuted">{time}</AppText>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.space3 },
  leading: { alignItems: 'center' },
  marker: {
    width: dimensions.timelineMarker, height: dimensions.timelineMarker, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center',
  },
  connection: { width: line.strong, flex: 1 },
  content: { flex: 1, gap: spacing.space1, paddingBottom: spacing.space5 },
  last: { paddingBottom: 0 },
});
