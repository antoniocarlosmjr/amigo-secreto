# 🎁 Amigo Secreto — Etapa 1

Fundação do projeto **Vite + TypeScript + Cloudflare Workers**. A V4 aprovada está disponível como demonstração local.

## Requisitos

- Node.js 20+ (recomendado Node.js 22)
- npm

## Executar frontend

```bash
npm install
npm run dev
```

Abra a URL exibida no terminal (geralmente http://localhost:5173). Clique em **Testar o protótipo V4**.

## Executar API (em outro terminal)

```bash
npm run api:dev
```

Verificação: http://localhost:8787/api/v1/health

## Validar build

```bash
npm run typecheck
npm run build
```

## Estrutura

- `apps/web`: frontend Vite/TypeScript e protótipo aprovado (`public/demo.html`).
- `apps/api`: Worker com endpoint inicial de health check.
- `docs`: arquitetura e decisões.
- `.github/workflows/ci.yml`: validação de frontend em push/PR para `main`.

## Ainda não implementado

Sorteio em produção, API de grupos, D1, autenticação administrativa, persistência de desejos, expiração automática, deploy Cloudflare e testes de integração. **Não utilize a demonstração para um sorteio real.**

## Próxima etapa

Definir migrações D1, contratos REST e testes do algoritmo de sorteio antes de integrar a interface.


## Créditos e GitHub

O rodapé exibe **Feito com 💜 por Antonio Martins**. O link do GitHub só aparece quando o repositório existir e for configurado.

1. Copie `apps/web/.env.example` para `apps/web/.env`.
2. Configure `VITE_GITHUB_URL=https://github.com/SEU_USUARIO/SEU_REPOSITORIO`.
3. Reinicie `npm run dev` para ver o link.

Para o deploy, configure `VITE_GITHUB_URL` nas variáveis de ambiente do build do frontend. Não coloque informações secretas em variáveis `VITE_`.

## Publicar no GitHub

Consulte [docs/github-setup.md](docs/github-setup.md) para criar o repositório, enviar o código e verificar o CI. A publicação na Cloudflare será configurada depois.


## Etapa 3 — API e D1 (em desenvolvimento)

Veja [`docs/etapa3-d1.md`](docs/etapa3-d1.md) para criar o banco, aplicar migrações e testar a API localmente. O frontend publicado permanece independente.
