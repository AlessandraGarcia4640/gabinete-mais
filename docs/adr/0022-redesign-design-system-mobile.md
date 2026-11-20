# ADR 0022 — Redesign do sistema de design mobile

Status: aceita.

## Contexto

O Gabinete+ usa a mesma base React Native no celular, no tablet e na web. O pacote de redesign especifica uma identidade visual comum com contraste nos dois temas e navegação adequada ao espaço disponível. Esta decisão substitui a ADR 0017.

## Decisão

Os tokens publicados no pacote são copiados para `apps/mobile/src/lib/theme.ts`. O provedor do app acompanha a preferência de cor do sistema. A interface usa IBM Plex Sans para texto, IBM Plex Mono para dados e Feather para ícones. Em caso de falha no carregamento das fontes, o app mantém a tipografia do sistema.

A navegação usa barra inferior até 599 pontos, trilho a partir de 600 e barra lateral a partir de 1200. Tarefas e Orientações passam a exibir lista e detalhe lado a lado a partir de 840 pontos.

## Consequências

Os controles compartilhados aplicam os tokens do tema e recebem valores e callbacks das telas. Os fluxos mantêm as URLs, as permissões e os contratos existentes. O contraste dos tokens fica coberto por testes automatizados. A navegação, o foco e o comportamento com ampliação de texto continuam sujeitos à verificação em execução.
