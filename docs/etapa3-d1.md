# Etapa 3 — D1 e API

## Antes de começar

Esta etapa é **backend separado**. O frontend em `amigo-secreto.antoniomartins.workers.dev` permanece intacto. Não configure uma rota `/api/*` no Worker público ainda; integração no mesmo domínio virá depois.

## Instalar e preparar o banco

```bash
npm install
npx wrangler login
npx wrangler d1 create amigo-secreto-db
```

Copie o `database_id` retornado e edite `apps/api/wrangler.toml`, descomentando `[[d1_databases]]` e preenchendo o ID real.

```bash
npx wrangler d1 migrations apply amigo-secreto-db --local --config apps/api/wrangler.toml
npm run api:dev
```

O servidor local costuma abrir em `http://localhost:8787`.

## Teste de criação (em outro Terminal)

```bash
curl -i http://localhost:8787/api/v1/health
curl -i -X POST http://localhost:8787/api/v1/groups \
  -H 'Content-Type: application/json' \
  -d '{"name":"Amigo Secreto da Família","eventDate":"2026-12-24","giftAmountCents":10000,"participants":[{"name":"Ana"},{"name":"Bruno"},{"name":"Carol"}],"restrictions":[[0,1]]}'
```

Copie `groupId` da resposta e consulte:

```bash
curl http://localhost:8787/api/v1/groups/COLE_GROUP_ID
```

O token administrativo é segredo: **não compartilhe nem faça commit**. Esta etapa ainda não implementa sorteio, envelopes ou listas de desejos.

## Publicar backend (somente após validar)

```bash
npx wrangler d1 migrations apply amigo-secreto-db --remote --config apps/api/wrangler.toml
npx wrangler deploy --config apps/api/wrangler.toml
```

Isso cria/publica um Worker **separado** chamado `amigo-secreto-api`. Não altere o deploy do frontend já existente. O endpoint de criação ainda não tem rate limiting; **não exponha o POST publicamente antes da etapa de segurança**. Por enquanto, teste apenas localmente.

## Segurança e próximos passos

- O sorteio será implementado na próxima etapa, com verificação de viabilidade e armazenamento seguro das atribuições.
- O link público não garante identidade: quem tiver o link poderá escolher nomes. O token admin não aparece na consulta pública.
- `expires_at` bloqueia a consulta após 60 dias; a limpeza física agendada ainda não está implementada.
- A lista de restrições usa índices de participantes (base zero); o esquema grava pares de IDs ordenados.
- A API não habilita CORS; o frontend publicado não a consome nesta etapa.
