import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { iconSize, line, radius, size, spacing, typography } from '../lib/theme';
import { useAppFonts, useTheme } from '../providers/theme-provider';
import { useFocusRing } from './control';
import { Icon } from './icon';
import { IconButton } from './icon-button';

interface SearchFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  onSubmit?: () => void;
  submitLabel?: string;
  maxLength?: number;
}

export function SearchField({ label, value, onChangeText, onSubmit, submitLabel, maxLength }: SearchFieldProps) {
  const { colors } = useTheme();
  const fontsLoaded = useAppFonts();
  const [focused, setFocused] = useState(false);
  const ring = useFocusRing(focused);
  return (
    <View style={[styles.field, onSubmit && submitLabel && styles.withSubmit, { backgroundColor: colors.surface, borderColor: colors.borderStrong }, ring]}>
      {onSubmit && submitLabel ? <IconButton icon="search" label={submitLabel} onPress={onSubmit} color="inkMuted" /> :
        <Icon name="search" size={iconSize.small} color="inkMuted" />}
      <TextInput
        allowFontScaling
        accessibilityLabel={label}
        autoCorrect={false}
        value={value}
        onChangeText={onChangeText}
        maxLength={maxLength}
        onSubmitEditing={onSubmit}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        returnKeyType="search"
        placeholder={label}
        placeholderTextColor={colors.inkSubtle}
        selectionColor={colors.brand}
        style={[styles.input, { color: colors.ink }, fontsLoaded && styles.font]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row', alignItems: 'center', minHeight: size.touchTarget,
    borderWidth: line.control, borderRadius: radius.full, paddingHorizontal: spacing.space4, gap: spacing.space2,
  },
  withSubmit: { paddingStart: 0, gap: 0 },
  input: {
    flex: 1, minHeight: size.touchTarget, minWidth: 0, fontSize: typography.body.fontSize,
    outlineWidth: 0, paddingVertical: spacing.space1,
  },
  font: { fontFamily: typography.body.fontFamily },
});
