import { EmptyState, Screen } from '../../../src/components';
import { useSplitView } from '../../../src/components/split-view';
import { GuidelineListScreen } from '../../../src/features/guidelines/screens';
import { strings } from '../../../src/lib/strings';

export default function GuidelinesRoute() {
  const split = useSplitView();
  return split ? <Screen><EmptyState message={strings.feedback.selectDetail} /></Screen> : <GuidelineListScreen />;
}
