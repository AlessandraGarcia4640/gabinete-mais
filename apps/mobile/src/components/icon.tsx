import Feather from '@expo/vector-icons/Feather';
import { size as sizes, type ColorTokens } from '../lib/theme';
import { useTheme } from '../providers/theme-provider';

type IconProps = {
  name: keyof typeof Feather.glyphMap;
  size?: 24 | 18 | 14;
  color?: keyof ColorTokens;
  accessibilityLabel?: string;
};

export function Icon({ name, size = sizes.icon, color = 'ink', accessibilityLabel }: IconProps) {
  const { colors } = useTheme();
  return (
    <Feather
      name={name}
      size={size}
      color={colors[color]}
      accessibilityRole={accessibilityLabel ? 'image' : undefined}
      accessibilityLabel={accessibilityLabel}
      accessible={Boolean(accessibilityLabel)}
      aria-hidden={!accessibilityLabel}
    />
  );
}
