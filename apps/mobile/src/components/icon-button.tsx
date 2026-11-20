import type { Ref } from 'react';
import { StyleSheet, type View } from 'react-native';
import { radius, size, type ColorTokens } from '../lib/theme';
import { useTheme } from '../providers/theme-provider';
import { Control } from './control';
import { Icon, type IconName } from './icon';

interface IconButtonProps {
  label: string;
  icon: IconName;
  onPress: () => void;
  disabled?: boolean;
  color?: keyof ColorTokens;
  ref?: Ref<View>;
}

export function IconButton({ label, icon, onPress, disabled = false, color = 'ink', ref }: IconButtonProps) {
  const { colors } = useTheme();
  return (
    <Control
      ref={ref}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={styles.button}
      pressedStyle={{ backgroundColor: colors.surfaceSunken }}
    >
      <Icon name={icon} color={color} />
    </Control>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: size.touchTarget, minHeight: size.touchTarget, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center',
  },
});
