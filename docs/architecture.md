# Arquitetura planejada

- Frontend: Vite + TypeScript (mobile-first).
- API: Cloudflare Workers.
- Banco: Cloudflare D1 (ainda não provisionado).
- Repositório: monorepo com npm workspaces.
- Deploy: será configurado após conectar a conta Cloudflare e o GitHub.

## Regras do produto

- Grupos de 3 a 50 pessoas, sorteio imediato, restrições mútuas opcionais.
- Um link público compartilhado; token administrativo separado.
- Escolha por cartões compactos com inicial e nome.
- Confirmação explícita antes da revelação; aviso de envelope já aberto.
- Mensagem personalizada: “Ana, você tirou... Bruno!”.
- Lista de desejos editável livremente, até 500 caracteres, sem autenticação.
- Consultas ilimitadas durante 60 dias desde a criação.
- Dados expiram após 60 dias; exclusão agendada será implementada.

## Limitação de privacidade

A escolha do nome não autentica a pessoa. Qualquer pessoa com o link público poderá abrir o envelope ou editar os desejos de outro participante. Não apresentar isso como acesso privado verificado.

## Estado atual

O arquivo `apps/web/public/demo.html` é uma demonstração local independente. Não utiliza a API e não deve ser usado para sorteios reais.
