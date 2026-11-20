import { useEffect, useRef, type PropsWithChildren, type ReactNode, type RefObject } from 'react';
import { AccessibilityInfo, Modal, Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { breakpoint, dimensions, radius, size, spacing } from '../lib/theme';
import { useTheme } from '../providers/theme-provider';
import { AppText } from './app-text';

export interface OverlayVisibility {
  title: string;
  visible: boolean;
  onDismiss: () => void;
  returnFocusRef?: RefObject<View | null>;
}

interface OverlayProps extends OverlayVisibility {
  placement: 'dialog' | 'sheet';
  headerAction?: ReactNode;
  headerIcon?: ReactNode;
}

function focus(target: View | null | undefined) {
  if (!target) return;
  if (Platform.OS === 'web') target.focus();
  else AccessibilityInfo.sendAccessibilityEvent(target, 'focus');
}

export function Overlay({
  title, visible, onDismiss, placement, headerAction, headerIcon, returnFocusRef, children,
}: PropsWithChildren<OverlayProps>) {
  const heading = useRef<View>(null);
  const opened = useRef(false);
  const { width } = useWindowDimensions();
  const { colors, shadow } = useTheme();
  const dialog = placement === 'dialog';
  const docked = !dialog && width >= breakpoint.expanded;

  useEffect(() => {
    const closed = opened.current && !visible;
    opened.current = visible;
    if (!closed || Platform.OS !== 'android') return;
    const frame = requestAnimationFrame(() => focus(returnFocusRef?.current));
    return () => cancelAnimationFrame(frame);
  }, [visible, returnFocusRef]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      accessibilityLabel={title}
      onRequestClose={onDismiss}
      onShow={() => focus(heading.current)}
      onDismiss={() => { if (Platform.OS === 'ios') focus(returnFocusRef?.current); }}
    >
      <SafeAreaView
        style={[
          styles.overlay, { backgroundColor: colors.overlay },
          dialog && styles.center, docked && styles.dock,
        ]}
        edges={['bottom', 'top']}
      >
        <Pressable
          accessible={false}
          focusable={false}
          aria-hidden
          onPress={onDismiss}
          style={StyleSheet.absoluteFill}
        />
        <View
          accessibilityViewIsModal
          style={[
            styles.panel, { backgroundColor: colors.surfaceRaised, boxShadow: shadow.level3 },
            dialog ? styles.dialog : docked ? styles.docked : styles.sheet,
          ]}
        >
          {!dialog && !docked && <View aria-hidden style={[styles.grip, { backgroundColor: colors.borderStrong }]} />}
          {headerIcon}
          <View style={styles.heading}>
            <View
              ref={heading}
              accessible
              accessibilityRole="header"
              accessibilityLabel={title}
              tabIndex={-1}
              style={styles.title}
            >
              <AppText variant="title" aria-hidden>{title}</AppText>
            </View>
            {headerAction}
          </View>
          {children}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  center: { justifyContent: 'center', padding: spacing.space6 },
  dock: { justifyContent: 'flex-start', alignItems: 'flex-end', padding: spacing.space6 },
  panel: { width: '100%', maxHeight: '100%', gap: spacing.space4 },
  dialog: { alignSelf: 'center', maxWidth: dimensions.dialogMax, borderRadius: radius.xl, padding: spacing.space6 },
  docked: { maxWidth: size.listPane, borderRadius: radius.xl, padding: spacing.space6 },
  sheet: {
    borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.space4, paddingTop: spacing.space3, paddingBottom: spacing.space6,
  },
  grip: { alignSelf: 'center', width: dimensions.sheetGrip, height: spacing.space1, borderRadius: radius.full },
  heading: { flexDirection: 'row', alignItems: 'center', gap: spacing.space2 },
  title: { flex: 1, minWidth: 0, outlineWidth: 0 },
});
