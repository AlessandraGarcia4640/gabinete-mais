import Feather from '@expo/vector-icons/Feather';
import { iconSize, type ColorTokens } from '../lib/theme';
import { useTheme } from '../providers/theme-provider';

export type IconName = keyof typeof Feather.glyphMap;

type IconProps = {
  name: IconName;
  size?: (typeof iconSize)[keyof typeof iconSize];
  color?: keyof ColorTokens;
  accessibilityLabel?: string;
};

export function Icon({ name, size = iconSize.standard, color = 'ink', accessibilityLabel }: IconProps) {
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
