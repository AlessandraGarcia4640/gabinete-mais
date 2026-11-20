import { createThemedStyles } from '../../providers/theme-provider';
export const useStyles = createThemedStyles((theme) => ({ content: { padding: 20 }, section: { gap: 12, paddingBottom: 20 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, title: { color: theme.colors.ink }, label: { color: theme.colors.ink }, text: { color: theme.colors.inkMuted }, error: { color: theme.colors.danger, paddingVertical: 12 },
}));
