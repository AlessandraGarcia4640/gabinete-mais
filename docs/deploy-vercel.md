# Deploy na Vercel

A versão web Expo e a API Express são dois projetos Vercel conectados ao mesmo
repositório. O PostgreSQL é um serviço separado e persistente. Este procedimento
não publica o aplicativo Android ou iOS.

## Pré-requisitos

- Conta Vercel com acesso ao repositório GitHub e integração GitHub instalada.
- PostgreSQL acessível pela Vercel, com conexões TLS e capacidade adequada para
  funções serverless. Use bancos separados para produção e testes/preview.
- Node.js 24 e pnpm 11.14.0 para executar migrations operacionalmente.

## API

1. Na Vercel, importe `AlessandraGarcia4640/gabinete-mais` e escolha
   `apps/api` como Root Directory. Habilite a inclusão de arquivos fora do Root
   Directory nas configurações do projeto: o monorepo usa `packages/shared` e
   `openapi`. Selecione Node.js 24. O arquivo `vercel.json` configura o build;
   não configure diretório de saída para a API Express.
2. Defina `DATABASE_URL` com a URL PostgreSQL e `JWT_ACCESS_SECRET` com um
   segredo aleatório exclusivo de pelo menos 32 caracteres. Marque o segredo como
   sensível. Configure valores separados para Production e Preview; não exponha
   credenciais em arquivos versionados ou variáveis `EXPO_PUBLIC_*`.
3. Antes de usar o ambiente, aplique as migrations a partir de uma máquina com
   acesso ao banco, usando a URL correta no ambiente:

   ```sh
   pnpm install --frozen-lockfile
   pnpm --filter @gabinete-plus/api exec prisma migrate deploy
   ```

   Não execute migrations automaticamente no build: builds concorrentes e
   previews não devem alterar o banco de produção. O seed é opcional e gera
   dados fictícios; consulte `docs/demonstracao.md` antes de executá-lo.
4. Faça o deploy e confira `https://<dominio-da-api>/health`. Configure proteção
   compartilhada contra tentativas excessivas nos endpoints de autenticação,
   por exemplo no firewall da Vercel. O limitador atual usa memória por processo
   e não oferece um limite global entre instâncias serverless.

## Aplicativo web

1. Importe o mesmo repositório em outro projeto Vercel, com Root Directory
   `apps/mobile`, inclusão de arquivos fora do diretório raiz e Node.js 24.
2. Defina `EXPO_PUBLIC_API_URL` como a URL HTTPS da API, sem barra final. Ela é
   pública e incorporada ao bundle no build. Use uma API e banco de teste para
   previews; alterações na variável exigem novo deploy.
3. Faça o deploy e valide login, navegação, atualização direta de uma rota e
   operações com dados de teste. A sessão no navegador fica apenas em memória.

Após a integração Git, commits na branch de produção geram deploys de produção e
pull requests geram previews, sujeitos às configurações do projeto. O preview da
API precisa de banco e segredos próprios. Os dois projetos devem ser configurados
no painel; os arquivos locais por si só não criam projetos, banco ou integração.

Referências: [monorepos na Vercel](https://vercel.com/docs/monorepos),
[Express na Vercel](https://vercel.com/docs/frameworks/backend/express) e
[publicação web Expo](https://docs.expo.dev/guides/publishing-websites/).
