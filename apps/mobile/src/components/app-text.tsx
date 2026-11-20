import { Text, type TextProps, type TextStyle } from 'react-native';
import { fontFamily, typography, type ColorTokens, type TextStyleName } from '../lib/theme';
import { useAppFonts, useTheme } from '../providers/theme-provider';

type AppTextProps = TextProps & { variant: TextStyleName; color?: keyof ColorTokens };

const systemWeight: Readonly<Record<string, TextStyle['fontWeight']>> = {
  [fontFamily.sans400]: '400',
  [fontFamily.sans500]: '500',
  [fontFamily.sans600]: '600',
  [fontFamily.mono400]: '400',
  [fontFamily.mono500]: '500',
};

export function AppText({ variant, color = 'ink', style, allowFontScaling = true, ...props }: AppTextProps) {
  const { colors } = useTheme();
  const fontsLoaded = useAppFonts();
  const { fontFamily: family, ...metrics } = typography[variant];
  const font = fontsLoaded ? { fontFamily: family } : { fontWeight: systemWeight[family] };

  return <Text {...props} allowFontScaling={allowFontScaling} style={[metrics, font, { color: colors[color] }, style]} />;
}
