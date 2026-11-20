import Markdown, { type ASTNode } from 'react-native-markdown-display';
import { strings } from '../lib/strings';
import { radius, spacing, typography } from '../lib/theme';
import { useAppFonts, useTheme } from '../providers/theme-provider';
import { AppText } from './app-text';

const rules = { image: (node: ASTNode) => <AppText variant="body" key={node.key}>{strings.guidelines.mediaNotice}</AppText> };

export function MarkdownContent({ content }: { content: string }) {
  const { colors } = useTheme();
  const fontsLoaded = useAppFonts();
  const code = {
    fontSize: typography.data.fontSize,
    fontFamily: fontsLoaded ? typography.data.fontFamily : undefined,
    color: colors.ink,
    backgroundColor: colors.surfaceSunken,
    borderColor: colors.border,
    borderRadius: radius.xs,
    padding: spacing.space1,
  };
  return (
    <Markdown
      rules={rules}
      onLinkPress={() => false}
      style={{
        body: { ...typography.body, fontFamily: fontsLoaded ? typography.body.fontFamily : undefined, color: colors.ink },
        link: { color: colors.brandText },
        blockquote: { backgroundColor: colors.surfaceSunken, color: colors.inkMuted, borderRadius: radius.md, borderLeftWidth: 0 },
        fence: code,
        code_block: code,
        code_inline: code,
      }}
    >
      {content}
    </Markdown>
  );
}
