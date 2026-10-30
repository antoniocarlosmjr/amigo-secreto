# Arquitetura — Amigo Secreto

## Visão geral

O aplicativo utiliza frontend Vite, API Cloudflare Workers e banco Cloudflare D1.

O frontend principal está em app/web/index.html, com HTML, CSS e JavaScript.

O Vite gera o build em app/web/dist, servido pelo Cloudflare Worker.

## Componentes

### Frontend

- Interface responsiva para celular e computador.
- Criação de grupos e participantes.
- Configuração de restrições.
- Sorteio e revelação de envelopes.
- Lista de desejos.
- Painel do organizador.

### Backend

- Cloudflare Workers com TypeScript.
- API de grupos, sorteios, envelopes e desejos.
- Validação de operações no servidor.
- Token administrativo separado.

### Banco de dados

- Cloudflare D1.
- Migrações SQL versionadas.
- Bancos independentes para staging e produção.

## Ambientes

Staging: amigo-secreto-staging

Produção: amigo-secreto

As configurações estão em app/api/wrangler.staging.toml e app/api/wrangler.toml.

## Regras do produto

- Grupos de 3 a 50 participantes.
- Sorteio imediato.
- Restrições mútuas opcionais.
- Um link público compartilhável.
- Token separado para o organizador.
- Confirmação antes da revelação.
- Aviso de envelope já aberto.
- Lista de desejos editável.
- Retenção planejada de 60 dias.

## Privacidade

O link público não autentica a identidade dos participantes.

Qualquer pessoa com esse link pode selecionar um nome, abrir seu envelope e acessar ou editar desejos.

O acesso administrativo deve permanecer separado do link público.

## Pendências

- Validar exclusão automática após 60 dias.
- Concluir testes de integração.
- Validar a máscara monetária no navegador.
- Verificar persistência das listas de desejos após atualizar a página.

## Deploy

O frontend deve ser compilado antes da publicação do Worker.

O GitHub Actions executa verificações, mas não realiza deploy automático.
