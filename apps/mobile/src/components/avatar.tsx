import { StyleSheet, View } from 'react-native';
import { dimensions, iconSize, radius, size, spacing, type TextStyleName } from '../lib/theme';
import { useTheme } from '../providers/theme-provider';
import { AppText } from './app-text';
import { Icon } from './icon';

type AvatarSize = 'sm' | 'md' | 'lg';

const appearance: Record<AvatarSize, {
  diameter: number;
  variant: TextStyleName;
  icon: (typeof iconSize)[keyof typeof iconSize];
}> = {
  sm: { diameter: dimensions.smallAvatar, variant: 'caption', icon: iconSize.extraSmall },
  md: { diameter: size.controlHeightSm, variant: 'label', icon: iconSize.small },
  lg: { diameter: dimensions.largeAvatar, variant: 'title', icon: iconSize.standard },
};

export function Avatar({ name, size: density = 'md' }: { name?: string; size?: AvatarSize }) {
  const { colors } = useTheme();
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  const initials = [parts[0], parts.length > 1 ? parts.at(-1) : undefined]
    .flatMap((part) => part ? Array.from(part).slice(0, 1) : [])
    .join('')
    .toLocaleUpperCase('pt-BR');
  const { diameter, variant, icon } = appearance[density];
  return (
    <View
      aria-hidden
      style={[styles.avatar, { minWidth: diameter, minHeight: diameter, backgroundColor: colors.brandSoft }]}
    >
      {initials ? <AppText variant={variant} emphasis color="brandText">{initials}</AppText>
        : <Icon name="user" size={icon} color="brandText" />}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignSelf: 'center', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: spacing.space1, borderRadius: radius.full,
  },
});
