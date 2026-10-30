# 🎁 Amigo Secreto

Aplicativo web para organizar sorteios de amigo secreto, sem cadastro, sem anúncios e sem solicitar telefone ou e-mail.

## Funcionalidades

- Grupos de 3 a 50 participantes.
- Sorteio imediato com restrições opcionais.
- Link compartilhável para os participantes.
- Revelação individual com confirmação.
- Lista de desejos.
- Painel do organizador com acesso separado.
- Persistência no Cloudflare D1.
- Interface responsiva para celular e computador.

## Tecnologias

- Frontend: HTML, CSS, JavaScript e Vite.
- Backend: TypeScript e Cloudflare Workers.
- Banco de dados: Cloudflare D1.
- Monorepo: npm workspaces.
- CI: GitHub Actions.

## Executar localmente

Requisitos: Node.js 20+ e npm.

Instale as dependências:

    npm install

Inicie a API em um terminal:

    npm run api:dev

Inicie o frontend em outro terminal:

    npm run dev

Acesse http://localhost:5173.

## Validar o projeto

    npm run typecheck
    npm run build

## Estrutura

- app/web/index.html: aplicação principal.
- app/web/vite.config.ts: configuração do frontend.
- app/api/src/: API do Cloudflare Worker.
- app/api/migrations/: migrações D1.
- app/api/wrangler.staging.toml: staging.
- app/api/wrangler.toml: produção.
- docs/: documentação técnica.

## Ambientes

Staging:
https://amigo-secreto-staging.antoniomartins.workers.dev

Produção:
https://amigo-secreto.antoniomartins.workers.dev

Os ambientes possuem Workers e bancos D1 separados.

## Privacidade

Não exigimos cadastro, telefone ou e-mail.

O link público não verifica a identidade dos participantes. Qualquer pessoa com esse link pode selecionar um nome, abrir seu envelope e acessar ou editar sua lista de desejos.

O acesso do organizador utiliza um token separado.

A retenção planejada é de 60 dias. A exclusão automática ainda precisa ser validada.

## Desenvolvimento

As alterações são testadas em staging antes da publicação em produção.

O GitHub Actions verifica o projeto, mas não realiza deploy automático.

## Créditos

Feito com 💜 por Antonio Martins.

GitHub: https://github.com/antoniocarlosmjr/amigo-secreto
