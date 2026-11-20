import { AppText } from './app-text';
import Markdown, { type ASTNode } from 'react-native-markdown-display';
import { useTheme } from '../providers/theme-provider';
import { strings } from '../lib/strings';
const rules = { image: (node: ASTNode) => <AppText variant="body" key={node.key}>{strings.guidelines.mediaNotice}</AppText> };
export function MarkdownContent({ content }: { content: string }) {
  const theme = useTheme();
  return <Markdown rules={rules} onLinkPress={() => false} style={{ body: { color: theme.colors.ink, fontSize: 16, lineHeight: 24 }, link: { color: theme.colors.brandText }, fence: { backgroundColor: theme.colors.surfaceSunken, color: theme.colors.ink }, code_inline: { color: theme.colors.ink, backgroundColor: theme.colors.surfaceSunken } }}>{content}</Markdown>; }
