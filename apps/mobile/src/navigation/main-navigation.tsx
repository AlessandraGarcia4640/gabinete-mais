import { useRouter } from 'expo-router';
import { TabTrigger, type TabTriggerSlotProps } from 'expo-router/ui';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Avatar, Icon } from '../components';
import { Control } from '../components/control';
import { strings } from '../lib/strings';
import { dimensions, iconSize, line, radius, size, spacing, typography } from '../lib/theme';
import { useSession } from '../providers/session-provider';
import { useTheme } from '../providers/theme-provider';
import { BrandMark } from './brand-mark';
import { destinations, primaryDestinations, sidebarDestinations, type Destination } from './route-metadata';

type Presentation = 'bar' | 'rail' | 'sidebar';

interface NavigationItemProps extends TabTriggerSlotProps {
  destination: Destination;
  presentation: Presentation;
  active: boolean;
}

function NavigationItem({ destination, presentation, active, onPress, onLongPress, ref }: NavigationItemProps) {
  const { colors } = useTheme();
  const sidebar = presentation === 'sidebar';
  const rail = presentation === 'rail';
  const currentPage = { 'aria-current': active ? 'page' : undefined };
  return (
    <Control
      {...currentPage}
      ref={ref}
      accessibilityRole={sidebar ? 'link' : 'tab'}
      accessibilityLabel={destination.label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      onLongPress={onLongPress}
      style={[
        styles.item, sidebar ? styles.horizontalItem : styles.pillItem,
        rail && styles.railItem, presentation === 'bar' && styles.barItem,
        sidebar && active && { backgroundColor: colors.brandSoft },
      ]}
      pressedStyle={{ backgroundColor: colors.surfaceSunken }}
    >
      <View style={[
        !sidebar && styles.pill,
        !sidebar && active && { backgroundColor: colors.brandSoft },
      ]}>
        <Icon
          name={destination.icon}
          size={sidebar ? iconSize.small : iconSize.standard}
          color={active ? 'brandText' : 'inkMuted'}
        />
      </View>
      <AppText variant="label" emphasis={active} color={active ? 'ink' : 'inkMuted'} style={!sidebar && styles.compactLabel}>
        {destination.label}
      </AppText>
    </Control>
  );
}

interface MainNavigationProps {
  presentation: Presentation;
  active: Destination['id'] | undefined;
  pathname: string;
}

export function MainNavigation({ presentation, active, pathname }: MainNavigationProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useSession();
  const profilePage = { 'aria-current': active === 'profile' ? 'page' : undefined };
  const compactItems = primaryDestinations.map((destination) => (
    <TabTrigger
      key={destination.id}
      name={destination.id}
      asChild
      reset="always"
      onPress={(event) => {
        if (active === destination.id && pathname !== destination.href) {
          event?.preventDefault();
          router.navigate(destination.href);
        }
      }}
    >
      <NavigationItem destination={destination} presentation={presentation} active={destination.id === active} />
    </TabTrigger>
  ));

  if (presentation === 'bar') {
    return (
      <SafeAreaView edges={['bottom']} style={[styles.bottom, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <View accessibilityRole="tablist" accessibilityLabel={strings.nav.main} style={styles.bottomItems}>
          {compactItems}
        </View>
      </SafeAreaView>
    );
  }

  const sidebar = presentation === 'sidebar';
  return (
    <SafeAreaView
      edges={['bottom']}
      role="navigation"
      accessibilityLabel={strings.nav.main}
      style={[
        styles.side, sidebar ? styles.sidebar : styles.rail,
        { backgroundColor: colors.surface, borderEndColor: colors.border },
      ]}
    >
      <View style={sidebar ? styles.sidebarBrand : styles.railBrand}><BrandMark compact={!sidebar} /></View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={sidebar ? styles.sidebarItems : styles.railItems}>
        {sidebar ? sidebarDestinations.map((destination) => (
          <NavigationItem
            key={destination.id}
            destination={destination}
            presentation="sidebar"
            active={destination.id === active}
            onPress={() => router.navigate(destination.href)}
          />
        )) : <View accessibilityRole="tablist" accessibilityLabel={strings.nav.main} style={styles.railItems}>{compactItems}</View>}
      </ScrollView>
      {sidebar && user && (
        <Control
          {...profilePage}
          accessibilityRole="link"
          accessibilityLabel={strings.nav.profile}
          accessibilityState={{ selected: active === 'profile' }}
          onPress={() => router.navigate(destinations.profile.href)}
          style={[
            styles.profile,
            active === 'profile' && { backgroundColor: colors.brandSoft },
          ]}
          pressedStyle={{ backgroundColor: colors.surfaceSunken }}
        >
          <Avatar name={user.name} />
          <View style={styles.profileText}>
            <AppText variant="label">{user.name}</AppText>
            <AppText variant="caption" color="inkMuted">{strings.session.roles[user.role]}</AppText>
          </View>
          <Icon name="chevron-right" size={iconSize.small} color="inkMuted" />
        </Control>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bottom: { borderTopWidth: line.thin },
  bottomItems: {
    minHeight: size.tabbarHeight, flexDirection: 'row',
    paddingHorizontal: spacing.space1, paddingVertical: spacing.space2,
  },
  side: { borderEndWidth: line.thin, paddingVertical: spacing.space4, gap: spacing.space6 },
  sidebar: { width: size.sidebarWidth, paddingHorizontal: spacing.space3 },
  rail: { width: size.railWidth, paddingHorizontal: spacing.space2 },
  sidebarBrand: { paddingHorizontal: spacing.space3, paddingTop: spacing.space1 },
  railBrand: { alignItems: 'center', paddingBottom: spacing.space2 },
  sidebarItems: { gap: spacing.space1, paddingVertical: spacing.space1 },
  railItems: { alignItems: 'center', gap: spacing.space2 },
  item: { minHeight: size.touchTarget, minWidth: 0, borderRadius: radius.md, justifyContent: 'center' },
  horizontalItem: {
    flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center',
    padding: spacing.space3, gap: spacing.space3,
  },
  pillItem: { alignItems: 'center', gap: line.strong },
  railItem: { width: dimensions.railItemWidth, minHeight: dimensions.railItemHeight },
  barItem: { flex: 1 },
  pill: {
    width: dimensions.navPillWidth, minHeight: dimensions.navPillHeight, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center',
  },
  compactLabel: {
    fontSize: typography.overline.fontSize, lineHeight: typography.overline.lineHeight, textAlign: 'center',
  },
  profile: {
    minHeight: size.touchTarget, flexDirection: 'row', alignItems: 'center', gap: spacing.space3,
    borderRadius: radius.md, padding: spacing.space3,
  },
  profileText: { flex: 1, minWidth: 0 },
});
