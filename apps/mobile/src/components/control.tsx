import { useState, type Ref } from 'react';
import { Pressable, type PressableProps, type StyleProp, type TextStyle, type View, type ViewStyle } from 'react-native';
import { line, opacity } from '../lib/theme';
import { useTheme } from '../providers/theme-provider';

interface ControlProps extends PressableProps {
  pressedStyle?: StyleProp<ViewStyle>;
  ref?: Ref<View>;
}

type FocusRing = Pick<TextStyle, 'outlineColor' | 'outlineOffset' | 'outlineStyle' | 'outlineWidth'>;

export function useFocusRing(focused: boolean): FocusRing | undefined {
  const { colors } = useTheme();
  if (!focused) return undefined;
  return {
    outlineColor: colors.focus,
    outlineOffset: line.focusOffset,
    outlineStyle: 'solid',
    outlineWidth: line.strong,
  };
}

export function Control({ pressedStyle, style, disabled, onFocus, onBlur, ...props }: ControlProps) {
  const [focused, setFocused] = useState(false);
  const ring = useFocusRing(focused && !disabled);
  return (
    <Pressable
      {...props}
      disabled={disabled}
      onFocus={(event) => { setFocused(true); onFocus?.(event); }}
      onBlur={(event) => { setFocused(false); onBlur?.(event); }}
      style={(state) => [
        typeof style === 'function' ? style(state) : style,
        state.pressed && pressedStyle,
        disabled && { opacity: opacity.disabled },
        ring,
      ]}
    />
  );
}
