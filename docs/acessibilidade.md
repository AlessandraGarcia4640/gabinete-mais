# Acessibilidade do app

O Gabinete+ acompanha o tema do sistema. Os dois temas usam a tipografia IBM Plex e os mesmos componentes de navegação, entrada e feedback. Controles expõem nomes, papéis e estados acessíveis. Chips usam uma marca de seleção, e selos de status combinam texto e ícone.

## Interação

- Os alvos interativos têm pelo menos 48 unidades lógicas, com 52 nos campos e botões padrão. Controles compactos ampliam a área de toque. Textos de controle permitem escalonamento de fonte e os formulários e detalhes permitem rolagem.
- O foco por teclado é visível. Diálogos e folhas focam o título ao abrir e aceitam uma referência ao gatilho para a restauração de foco no dispositivo. Campos associam a mensagem de erro ao rótulo acessível. Estados de carregamento, falha e confirmação usam regiões de anúncio.
- A navegação principal usa barra inferior no celular, barra lateral compacta no tablet e barra lateral com rótulos no espaço expandido. Tarefas e Orientações exibem lista e detalhe lado a lado a partir de 840 px.

## Contraste

Os testes calculam a razão de contraste por luminância sRGB nos dois temas. O mínimo é 4,5:1 para texto e 3:1 para bordas de controle e indicação de foco. A tabela traz pares presentes nos fluxos do app.

| Par de tokens | Claro | Escuro |
| --- | ---: | ---: |
| Texto principal sobre superfície | 15,80:1 | 14,46:1 |
| Texto secundário sobre superfície | 6,91:1 | 7,86:1 |
| Texto do botão principal sobre sua cor de fundo | 9,16:1 | 7,74:1 |
| Borda de controle sobre superfície | 3,74:1 | 4,07:1 |
| Indicação de foco sobre fundo da tela | 8,34:1 | 10,77:1 |

Referências para os limiares de contraste. [WCAG 2.2 para texto](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) · [WCAG 2.2 para controles](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)

## Evidências e pendências

Os testes automatizados verificam foco, papéis, estados, alvos e contraste. A inspeção visual no Chrome cobriu 390, 834 e 1360 px nos temas claro e escuro, incluindo navegação por teclado e fechamento de sobreposições nos componentes compartilhados.

A execução com TalkBack e VoiceOver, a restauração de foco com tecnologia assistiva e o teste físico de teclado externo e ampliação a 200% seguem pendentes. Este ambiente não dispunha de dispositivos nem emuladores Android e iOS para esses cenários.
