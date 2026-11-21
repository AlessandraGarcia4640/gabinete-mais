import { MarkdownIt, stringToTokens, type ASTNode, tokensToAST } from 'react-native-markdown-display';

const markdown = new MarkdownIt({ html: false });

function readableText(node: ASTNode): string {
  switch (node.sourceType) {
    case 'text':
    case 'code_inline':
    case 'code_block':
    case 'fence':
      return node.content;
    case 'softbreak':
    case 'hardbreak':
      return ' ';
    case 'image':
      return '';
    default:
      return node.children.map(readableText).join(node.sourceType === 'inline' ? '' : ' ');
  }
}

export function guidelineExcerpt(content: string) {
  return tokensToAST(stringToTokens(content, markdown)).map(readableText).join(' ').replace(/\s+/g, ' ').trim();
}
