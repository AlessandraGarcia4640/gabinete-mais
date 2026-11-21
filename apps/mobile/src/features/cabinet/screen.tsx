import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppText, Card, Icon, Screen } from '../../components';
import { strings } from '../../lib/strings';
import { iconSize, radius, size, spacing } from '../../lib/theme';
import { cabinetDestinations } from '../../navigation/route-metadata';
import { useTheme } from '../../providers/theme-provider';

export function CabinetScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.copy}>
          <AppText variant="titleLg" accessibilityRole="header">{strings.nav.cabinet}</AppText>
          <AppText variant="label" color="inkMuted">{strings.cabinet.description}</AppText>
        </View>
        <View style={styles.cards}>
          {cabinetDestinations.map(({ id, label, description, icon, href }) => (
            <Card key={id} label={label} hint={description} style={styles.card} onPress={() => router.push(href)}>
              <View style={[styles.icon, { backgroundColor: colors.brandSoft }]}>
                <Icon name={icon} color="brandText" />
              </View>
              <View style={styles.cardCopy}>
                <AppText variant="heading">{label}</AppText>
                <AppText variant="label" color="inkMuted">{description}</AppText>
              </View>
              <Icon name="chevron-right" size={iconSize.small} />
            </Card>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { width: '100%', maxWidth: size.contentMax, alignSelf: 'center', padding: spacing.space4, gap: spacing.space4 },
  copy: { gap: spacing.space1 },
  cards: { gap: spacing.space3 },
  card: { flexDirection: 'row', alignItems: 'center' },
  cardCopy: { flex: 1, minWidth: 0, gap: spacing.space1 },
  icon: { width: size.touchTarget, height: size.touchTarget, borderRadius: radius.sm, justifyContent: 'center', alignItems: 'center' },
});
