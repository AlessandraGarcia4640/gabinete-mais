import { createContext, useContext, type PropsWithChildren, type ReactNode } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { breakpoint, line, size } from '../lib/theme';
import { useTheme } from '../providers/theme-provider';

const SplitContext = createContext(false);

export function useSplitView() {
  return useContext(SplitContext);
}

export function SplitView({ list, children }: PropsWithChildren<{ list?: ReactNode }>) {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const split = width >= breakpoint.expanded && !!list;
  return (
    <SplitContext.Provider value={split}>
      <View style={styles.layout}>
        {split && <View style={[styles.list, { borderEndColor: colors.border }]}>{list}</View>}
        <View style={styles.detail}>{children}</View>
      </View>
    </SplitContext.Provider>
  );
}

const styles = StyleSheet.create({
  layout: { flex: 1, flexDirection: 'row', minHeight: 0, minWidth: 0 },
  list: { width: size.listPane, borderEndWidth: line.thin, minHeight: 0 },
  detail: { flex: 1, minWidth: 0, minHeight: 0 },
});
