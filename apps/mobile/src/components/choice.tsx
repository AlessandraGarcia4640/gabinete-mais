import { Chip } from './chip';

interface ChoiceProps {
  label: string;
  context?: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export function Choice(props: ChoiceProps) {
  return <Chip {...props} mode="radio" />;
}
