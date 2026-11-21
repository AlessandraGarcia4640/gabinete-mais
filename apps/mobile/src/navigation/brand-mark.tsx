import { AppText } from '../components';
import { strings } from '../lib/strings';

export function BrandMark({ compact = false, large = false }: { compact?: boolean; large?: boolean }) {
  const variant = large ? 'display' : 'title';
  const name = compact ? strings.brand.slice(0, 1) : strings.brand.slice(0, -1);
  return (
    <AppText variant={variant} accessibilityLabel={strings.brand}>
      {name}<AppText variant={variant} color="accentText">{strings.brand.slice(-1)}</AppText>
    </AppText>
  );
}
