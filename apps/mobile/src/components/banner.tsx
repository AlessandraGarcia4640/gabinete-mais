import { StyleSheet, View } from 'react-native';
import { iconSize, radius, spacing, type ColorTokens } from '../lib/theme';
import { useTheme } from '../providers/theme-provider';
import { AppText } from './app-text';
import { Icon, type IconName } from './icon';

type BannerTone = 'info' | 'warn' | 'danger' | 'success' | 'neutral';

const tones: Record<BannerTone, { fill: keyof ColorTokens; color: keyof ColorTokens; symbol: IconName }> = {
  info: { fill: 'infoSoft', color: 'info', symbol: 'info' },
  warn: { fill: 'accentSoft', color: 'accentText', symbol: 'alert-triangle' },
  danger: { fill: 'dangerSoft', color: 'danger', symbol: 'alert-circle' },
  success: { fill: 'successSoft', color: 'success', symbol: 'check-circle' },
  neutral: { fill: 'surfaceSunken', color: 'inkMuted', symbol: 'info' },
};

interface BannerProps {
  message: string;
  tone?: BannerTone;
  icon?: IconName;
}

export function Banner({ message, tone = 'info', icon }: BannerProps) {
  const { colors } = useTheme();
  const { fill, color, symbol } = tones[tone];
  const role = tone === 'danger' ? 'alert' : tone === 'success' ? 'status' : undefined;
  return (
    <View style={[styles.banner, { backgroundColor: colors[fill] }]}>
      <Icon name={icon ?? symbol} size={iconSize.small} color={color} />
      <AppText variant="label" role={role} accessibilityLiveRegion={role ? 'polite' : undefined} style={styles.message}>
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: radius.lg, flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: spacing.space4, paddingVertical: spacing.space3, gap: spacing.space3,
  },
  message: { flex: 1 },
});
