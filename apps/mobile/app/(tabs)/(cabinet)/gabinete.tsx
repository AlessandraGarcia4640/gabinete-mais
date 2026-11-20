import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import { LargeHeader, ListGroup, ListRow, Screen } from '../../../src/components';
import { strings } from '../../../src/lib/strings';
import { size, spacing } from '../../../src/lib/theme';
import { cabinetDestinations } from '../../../src/navigation/route-metadata';

export default function CabinetRoute() {
  const router = useRouter();
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <LargeHeader title={strings.nav.cabinet} />
        <ListGroup>
          {cabinetDestinations.map((destination) => (
            <ListRow key={destination.id} title={destination.label} icon={destination.icon} onPress={() => router.push(destination.href)} />
          ))}
        </ListGroup>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { width: '100%', maxWidth: size.contentMax, alignSelf: 'center', padding: spacing.space4, gap: spacing.space6 },
});
