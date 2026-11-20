// Gabinete+ — tokens do design system (gerado de design-system/tokens.json).
// Destino sugerido: apps/mobile/src/lib/theme.ts (substitui o tema atual). Não edite valores à mão: altere tokens.json e regenere.

export type ThemeName = 'light' | 'dark';

export interface ColorTokens {
  /** Fundo de página em todas as telas. Papel levemente quente no claro; petróleo quase preto no escuro. */
  readonly bg: string;
  /** Cartões, listas, campos, barras de navegação e folhas (sheets) sobre `bg`. */
  readonly surface: string;
  /** Áreas rebaixadas: trilho de progresso, fundo de campo de busca, blocos de código, linha pressionada. */
  readonly surfaceSunken: string;
  /** Elementos elevados sobre `surface`: diálogos, menus, folhas modais. No escuro a elevação vem do tom, não da sombra. */
  readonly surfaceRaised: string;
  /** Texto principal e títulos sobre `bg`, `surface`, `surface-sunken`, `surface-raised` e `brand-soft`. */
  readonly ink: string;
  /** Texto secundário, descrições e metadados sobre `bg`, `surface` e `surface-sunken`. */
  readonly inkMuted: string;
  /** Placeholders, legendas e ícones inativos da navegação sobre `bg` e `surface`. */
  readonly inkSubtle: string;
  /** Divisórias e contorno decorativo de cartões. Não carrega significado: nunca é a única marca de um controle. */
  readonly border: string;
  /** Contorno de controles (campos, chips, checkbox, botão secundário) sobre `bg` e `surface`; mínimo 3:1. */
  readonly borderStrong: string;
  /** Azul-petróleo da marca: botão primário, item ativo da navegação, checkbox marcado, barra de progresso. */
  readonly brand: string;
  /** Estado pressionado/hover de preenchimentos `brand`. */
  readonly brandHover: string;
  /** Texto e ícones sobre `brand` e `brand-hover`. */
  readonly onBrand: string;
  /** Realce suave da marca: indicador do item ativo, chip selecionado, avatar, fundo de destaque. */
  readonly brandSoft: string;
  /** Links e rótulos de ação em texto sobre `bg`, `surface` e `brand-soft`. */
  readonly brandText: string;
  /** Âmbar: único acento. Preenchimento de destaques de prazo e do selo de contagem (reservado). Nunca para ações. */
  readonly accent: string;
  /** Texto e ícones sobre `accent`. */
  readonly onAccent: string;
  /** Fundo de avisos de prazo, selo `Em andamento` e faixa de atenção. */
  readonly accentSoft: string;
  /** Texto de prazo próximo, prioridade alta e status `Em andamento` sobre `surface`, `bg` e `accent-soft`. */
  readonly accentText: string;
  /** Texto e ícone de `Concluída` e confirmações sobre `surface` e `success-soft`. Sempre com ícone de check e palavra. */
  readonly success: string;
  /** Fundo de selos e faixas de sucesso. */
  readonly successSoft: string;
  /** Erros, `Em atraso`, prioridade urgente e ações destrutivas, sobre `surface`, `bg` e `danger-soft`. Sempre com ícone e palavra. */
  readonly danger: string;
  /** Texto sobre preenchimento `danger` (botão destrutivo de confirmação). */
  readonly onDanger: string;
  /** Fundo de mensagens de erro e selo `Em atraso`. */
  readonly dangerSoft: string;
  /** Status `Aberta`/`Por fazer` e avisos informativos sobre `surface` e `info-soft`. */
  readonly info: string;
  /** Fundo de selos e faixas informativas (ex.: cópia preservada, somente leitura). */
  readonly infoSoft: string;
  /** Anel de foco sólido de 2px com 2px de afastamento em todo controle; 3:1 sobre `bg` e `surface`. */
  readonly focus: string;
  /** Véu atrás de diálogos e folhas modais. */
  readonly overlay: string;
  /** Status de tarefa `Aberta` e de execução `Por fazer`. */
  readonly statusAberta: string;
  /** Status `Em andamento`. */
  readonly statusAndamento: string;
  /** Status `Concluída`. */
  readonly statusConcluida: string;
  /** Status `Cancelada` e itens arquivados. */
  readonly statusCancelada: string;
  /** Prioridade `Urgente`. */
  readonly prioridadeUrgente: string;
  /** Prioridade `Alta`. */
  readonly prioridadeAlta: string;
  /** Prioridade `Normal`. */
  readonly prioridadeNormal: string;
  /** Prioridade `Baixa`. */
  readonly prioridadeBaixa: string;
}

const lightColors: ColorTokens = {
  bg: '#F6F4EF',
  surface: '#FFFFFF',
  surfaceSunken: '#ECE9E1',
  surfaceRaised: '#FFFFFF',
  ink: '#14252B',
  inkMuted: '#4A5D64',
  inkSubtle: '#5C6F76',
  border: '#DAD5CA',
  borderStrong: '#76878C',
  brand: '#0E4F5C',
  brandHover: '#0A3D47',
  onBrand: '#FFFFFF',
  brandSoft: '#DCEBEC',
  brandText: '#0E4F5C',
  accent: '#F0A93B',
  onAccent: '#2B1A00',
  accentSoft: '#FBEED6',
  accentText: '#8A4B06',
  success: '#126B55',
  successSoft: '#DDF0E8',
  danger: '#B42318',
  onDanger: '#FFFFFF',
  dangerSoft: '#FBE7E4',
  info: '#1F56A3',
  infoSoft: '#E2ECF9',
  focus: '#0E4F5C',
  overlay: 'rgba(13,22,25,0.55)',
  statusAberta: '#1F56A3',
  statusAndamento: '#8A4B06',
  statusConcluida: '#126B55',
  statusCancelada: '#4A5D64',
  prioridadeUrgente: '#B42318',
  prioridadeAlta: '#8A4B06',
  prioridadeNormal: '#4A5D64',
  prioridadeBaixa: '#5C6F76',
};

const darkColors: ColorTokens = {
  bg: '#0D1619',
  surface: '#152125',
  surfaceSunken: '#091013',
  surfaceRaised: '#1C2B30',
  ink: '#EEF1EE',
  inkMuted: '#A7B6B9',
  inkSubtle: '#84979B',
  border: '#283A3F',
  borderStrong: '#6D8287',
  brand: '#62C3CF',
  brandHover: '#84D3DD',
  onBrand: '#06262C',
  brandSoft: '#16393F',
  brandText: '#7CCFDA',
  accent: '#F2B458',
  onAccent: '#2B1A00',
  accentSoft: '#3B2B10',
  accentText: '#F4C277',
  success: '#63CFA8',
  successSoft: '#12352C',
  danger: '#FF9085',
  onDanger: '#3B0D08',
  dangerSoft: '#43201C',
  info: '#8FB9F4',
  infoSoft: '#172C47',
  focus: '#84D3DD',
  overlay: 'rgba(0,0,0,0.65)',
  statusAberta: '#8FB9F4',
  statusAndamento: '#F4C277',
  statusConcluida: '#63CFA8',
  statusCancelada: '#A7B6B9',
  prioridadeUrgente: '#FF9085',
  prioridadeAlta: '#F4C277',
  prioridadeNormal: '#A7B6B9',
  prioridadeBaixa: '#84979B',
};

export const colors: Readonly<Record<ThemeName, ColorTokens>> = { light: lightColors, dark: darkColors };

export const spacing = {
  /** Entre ícone e texto dentro de um selo. */
  space1: 4,
  /** Entre elementos de uma mesma linha; gap de chips. */
  space2: 8,
  /** Gap entre itens de lista e entre cartões. */
  space3: 12,
  /** Padding de cartão e margem lateral da tela no celular. */
  space4: 16,
  /** Gap entre campos de formulário. */
  space5: 20,
  /** Entre seções; margem lateral no tablet. */
  space6: 24,
  /** Entre blocos de página; margem lateral no layout largo. */
  space8: 32,
  /** Respiro acima de títulos de página no layout largo. */
  space10: 40,
  /** Padding vertical de estados vazios. */
  space12: 48,
  /** Topo de telas de entrada (login). */
  space16: 64,
} as const;

export const radius = {
  /** Checkbox e blocos de código. */
  xs: 6,
  /** Selos, campos de busca compactos, item de menu. */
  sm: 10,
  /** Botões, campos e chips retangulares. */
  md: 14,
  /** Cartões, itens de lista agrupados, faixas de aviso. */
  lg: 20,
  /** Folhas modais (cantos superiores) e diálogos. */
  xl: 28,
  /** Pílulas: chips de filtro, selos de status, avatar, indicador de navegação. */
  full: 999,
} as const;

export const size = {
  /** Área mínima de toque de qualquer controle. */
  touchTarget: 48,
  /** Altura de botões e campos de texto. */
  controlHeight: 52,
  /** Altura de chips de filtro e botões compactos em barras (área de toque continua 48px). */
  controlHeightSm: 40,
  /** Ícone padrão; 20px dentro de selos e chips. */
  icon: 24,
  /** Barra de navegação inferior (celular). */
  tabbarHeight: 64,
  /** Trilho de navegação lateral (tablet). */
  railWidth: 88,
  /** Barra lateral fixa (web/desktop). */
  sidebarWidth: 264,
  /** Largura máxima de formulários e leitura. */
  contentMax: 720,
  /** Largura do painel de lista no layout lista + detalhe. */
  listPane: 400,
} as const;

export const breakpoint = {
  /** Celular: uma coluna, barra inferior com 5 destinos. */
  compact: 0,
  /** Tablet em pé: trilho lateral, uma coluna de conteúdo centralizada. */
  medium: 600,
  /** Tablet deitado e janelas largas: trilho + lista e detalhe lado a lado. */
  expanded: 840,
  /** Desktop/web: barra lateral fixa com rótulos + lista e detalhe. */
  large: 1200,
} as const;

export const opacity = {
  disabled: 0.5,
  pressed: 0.08,
} as const;

/** Nomes de família registrados por `useFonts` (@expo-google-fonts/ibm-plex-sans e -mono). */
export const fontFamily = {
  sans400: 'IBMPlexSans_400Regular',
  sans500: 'IBMPlexSans_500Medium',
  sans600: 'IBMPlexSans_600SemiBold',
  mono400: 'IBMPlexMono_400Regular',
  mono500: 'IBMPlexMono_500Medium',
} as const;

export interface TextStyleToken {
  readonly fontFamily: string;
  readonly fontSize: number;
  readonly lineHeight: number;
  readonly letterSpacing?: number;
  readonly textTransform?: 'uppercase';
}

export type TextStyleName = 'display' | 'titleLg' | 'title' | 'heading' | 'body' | 'bodyStrong' | 'label' | 'caption' | 'overline' | 'data' | 'dataLg';

export const typography: Readonly<Record<TextStyleName, TextStyleToken>> = {
  /** Saudação do Início e título de telas de entrada (login). */
  display: { fontFamily: fontFamily.sans600, fontSize: 32, lineHeight: 38, letterSpacing: -0.32 },
  /** Título de página no layout largo e de detalhe no celular. */
  titleLg: { fontFamily: fontFamily.sans600, fontSize: 24, lineHeight: 30, letterSpacing: -0.12 },
  /** Título de seção e de folhas/diálogos. */
  title: { fontFamily: fontFamily.sans600, fontSize: 20, lineHeight: 26 },
  /** Título de cartão e de item de lista. */
  heading: { fontFamily: fontFamily.sans600, fontSize: 17, lineHeight: 24 },
  /** Texto corrido, valores de campo, conteúdo de orientações. */
  body: { fontFamily: fontFamily.sans400, fontSize: 16, lineHeight: 24 },
  /** Ênfase em texto corrido e rótulo de botão. */
  bodyStrong: { fontFamily: fontFamily.sans600, fontSize: 16, lineHeight: 24 },
  /** Rótulo de campo, chip, aba, metadado em destaque. */
  label: { fontFamily: fontFamily.sans500, fontSize: 14, lineHeight: 20 },
  /** Texto de apoio, ajuda de campo, data e autoria. */
  caption: { fontFamily: fontFamily.sans400, fontSize: 13, lineHeight: 18 },
  /** Cabeçalho de grupo em listas e navegação; sempre em maiúsculas. */
  overline: { fontFamily: fontFamily.sans600, fontSize: 12, lineHeight: 16, letterSpacing: 0.72, textTransform: 'uppercase' },
  /** Datas, prazos, contadores, versões e identificadores alinhados em coluna. */
  data: { fontFamily: fontFamily.mono500, fontSize: 14, lineHeight: 20 },
  /** Número de destaque. Reservado: nenhuma tela desta entrega o utiliza. */
  dataLg: { fontFamily: fontFamily.mono500, fontSize: 28, lineHeight: 32, letterSpacing: -0.56 },
};

/** Sombras como `boxShadow` (React Native 0.76+ na nova arquitetura). Confirme o suporte na versão instalada antes de usar. */
export const shadow: Readonly<Record<ThemeName, Readonly<Record<'level1' | 'level2' | 'level3', string>>>> = {
  light: {
    level1: '0 1px 2px rgba(20,37,43,0.06), 0 1px 1px rgba(20,37,43,0.04)',
    level2: '0 6px 16px rgba(20,37,43,0.10), 0 2px 4px rgba(20,37,43,0.06)',
    level3: '0 20px 48px rgba(20,37,43,0.18), 0 4px 12px rgba(20,37,43,0.08)',
  },
  dark: {
    level1: '0 1px 2px rgba(0,0,0,0.4)',
    level2: '0 6px 16px rgba(0,0,0,0.5)',
    level3: '0 20px 48px rgba(0,0,0,0.6)',
  },
};

export interface Theme {
  readonly name: ThemeName;
  readonly colors: ColorTokens;
  readonly shadow: Readonly<Record<'level1' | 'level2' | 'level3', string>>;
}

export const themes: Readonly<Record<ThemeName, Theme>> = {
  light: { name: 'light', colors: colors.light, shadow: shadow.light },
  dark: { name: 'dark', colors: colors.dark, shadow: shadow.dark },
};

// Medidas de componentes especificadas em design-system/bundle.css.
export const line = { thin: 1, control: 1.5, strong: 2, focusOffset: 2 };
export const iconSize = { standard: size.icon, small: 18, extraSmall: 14 } as const;
export const dimensions = {
  appBar: 56,
  fab: 56,
  listRow: 56,
  switchKnob: 20,
  smallAvatar: 28,
  largeAvatar: 64,
  timelineMarker: 32,
  textArea: 120,
  dialogMax: 440,
  sheetGrip: 36,
  keyColumn: 112,
  navPillWidth: 56,
  navPillHeight: 28,
  railItemWidth: 72,
  railItemHeight: 60,
  loginMax: 480,
  recoveryMessageMax: 280,
  pageMax: 1120,
};
