import Markdown, { type ASTNode } from 'react-native-markdown-display';
import { strings } from '../lib/strings';
import { line, radius, spacing, typography } from '../lib/theme';
import { useAppFonts, useTheme } from '../providers/theme-provider';
import { AppText } from './app-text';

const rules = { image: (node: ASTNode) => <AppText variant="body" key={node.key}>{strings.guidelines.mediaNotice}</AppText> };

export function MarkdownContent({ content }: { content: string }) {
  const { colors } = useTheme();
  const fontsLoaded = useAppFonts();
  const text = (variant: 'body' | 'bodyStrong' | 'title' | 'heading') => ({
    ...typography[variant], fontFamily: fontsLoaded ? typography[variant].fontFamily : undefined,
  });
  const heading = { ...text('heading'), marginTop: spacing.space4, marginBottom: spacing.space2 };
  const code = {
    fontSize: typography.data.fontSize,
    fontFamily: fontsLoaded ? typography.data.fontFamily : undefined,
    color: colors.ink,
    backgroundColor: colors.surfaceSunken,
    borderColor: colors.border,
    borderWidth: line.thin,
    borderRadius: radius.xs,
    padding: spacing.space1,
  };
  return (
    <Markdown
      rules={rules}
      onLinkPress={() => false}
      style={{
        body: { ...text('body'), color: colors.ink },
        heading1: { ...heading, ...text('title') },
        heading2: heading,
        heading3: heading,
        heading4: heading,
        heading5: heading,
        heading6: heading,
        paragraph: { marginTop: spacing.space1, marginBottom: spacing.space3 },
        strong: { ...text('bodyStrong'), fontWeight: fontsLoaded ? 'normal' : 'bold' },
        link: { color: colors.brandText, textDecorationLine: 'underline' },
        hr: { backgroundColor: colors.border, height: line.thin, marginVertical: spacing.space3 },
        blockquote: {
          backgroundColor: colors.surfaceSunken, color: colors.inkMuted, borderRadius: radius.md,
          borderLeftWidth: 0, marginLeft: 0, marginVertical: spacing.space2, padding: spacing.space4,
        },
        list_item: { paddingBottom: spacing.space2 },
        bullet_list_icon: { marginLeft: 0, marginRight: spacing.space2 },
        ordered_list_icon: { marginLeft: 0, marginRight: spacing.space2 },
        fence: code,
        code_block: code,
        code_inline: code,
      }}
    >
      {content}
    </Markdown>
  );
}
