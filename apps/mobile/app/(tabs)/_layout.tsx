import { useGlobalSearchParams, usePathname, useRouter } from 'expo-router';
import { TabList, TabSlot, Tabs, TabTrigger } from 'expo-router/ui';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppBar, AppText, SegmentedControl } from '../../src/components';
import { SplitView } from '../../src/components/split-view';
import { GuidelineListScreen } from '../../src/features/guidelines/screens';
import { TaskListScreen } from '../../src/features/tasks/screens';
import { strings } from '../../src/lib/strings';
import { breakpoint, size, spacing } from '../../src/lib/theme';
import { MainNavigation } from '../../src/navigation/main-navigation';
import { FormNavigationProvider } from '../../src/navigation/form-navigation-context';
import { navigationPresentation, primaryDestinations, routeMetadata, type RoutineView } from '../../src/navigation/route-metadata';
import { useTheme } from '../../src/providers/theme-provider';

const routineViews = [
  { value: '/rotinas', label: strings.nav.routines },
  { value: '/checklists', label: strings.nav.checklists },
  { value: '/execucoes', label: strings.nav.executions },
] satisfies [{ value: RoutineView; label: string }, { value: RoutineView; label: string }, { value: RoutineView; label: string }];

function AuthenticatedShell() {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const { id } = useGlobalSearchParams<{ id?: string }>();
  const presentation = navigationPresentation(width);
  const route = routeMetadata(pathname);
  const { backTo, routineView } = route;
  const wideSplit = width >= breakpoint.expanded && !!route.split;
  const list = route.split === 'tasks' ? (
    <TaskListScreen selectedId={id} />
  ) : route.split === 'guidelines' ? (
    <View style={styles.body}><AppBar title={strings.nav.guidelines} /><GuidelineListScreen selectedId={id} /></View>
  ) : undefined;
  const goBack = backTo ? () => {
    if (router.canGoBack()) router.back();
    else router.replace(backTo);
  } : undefined;
  const navigation = (
    <MainNavigation
      presentation={presentation}
      active={presentation === 'sidebar' ? route.sidebar : route.primary}
      pathname={pathname}
    />
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.shell, { backgroundColor: colors.bg }]}>
      <View style={styles.workspace}>
        {presentation !== 'bar' && navigation}
        <View style={styles.body}>
          {route.title && !wideSplit && !routineView && <AppBar title={route.title} onBack={goBack} />}
          {routineView && (
            <View style={styles.segments}>
              <AppText variant="titleLg" accessibilityRole="header">{route.title ?? strings.nav.routines}</AppText>
              <SegmentedControl<RoutineView>
                label={strings.nav.routines}
                options={routineViews}
                value={routineView}
                onChange={(value) => { if (value !== routineView) router.replace(value); }}
              />
            </View>
          )}
          <SplitView list={list}><TabSlot style={styles.slot} /></SplitView>
        </View>
      </View>
      {presentation === 'bar' && route.top && navigation}
    </SafeAreaView>
  );
}

function TabRegistration() {
  return null;
}

export default function SessionLayout() {
  return (
    <Tabs style={styles.shell} options={{ backBehavior: 'fullHistory' }}>
      <TabList style={styles.hidden}>
        {primaryDestinations.map(({ id, href }) => (
          <TabTrigger key={id} name={id} href={href} asChild><TabRegistration /></TabTrigger>
        ))}
      </TabList>
      <FormNavigationProvider><AuthenticatedShell /></FormNavigationProvider>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  hidden: { display: 'none' },
  workspace: { flex: 1, flexDirection: 'row', minHeight: 0 },
  body: { flex: 1, minWidth: 0, minHeight: 0 },
  slot: { flex: 1, minHeight: 0 },
  segments: { width: '100%', maxWidth: size.contentMax, alignSelf: 'center', gap: spacing.space2, paddingTop: spacing.space4, paddingHorizontal: spacing.space4 },
});
