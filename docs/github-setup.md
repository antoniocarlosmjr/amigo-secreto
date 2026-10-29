# Publicar o projeto no GitHub

## 1. Criar repositório

Em https://github.com/new, crie um repositório chamado `amigo-secreto` (ou outro nome). Não marque README, .gitignore nem licença, pois já existem arquivos locais.

## 2. Publicar do Mac

Abra o Terminal dentro da pasta do projeto e execute:

```bash
git init
git branch -M main
git add .
git commit -m "chore: initial project foundation"
git remote add origin https://github.com/SEU_USUARIO/amigo-secreto.git
git push -u origin main
```

Se o projeto já for um repositório Git, pule `git init` e verifique `git remote -v` antes de adicionar `origin`.

## 3. Rodapé

Copie `apps/web/.env.example` para `apps/web/.env` e preencha `VITE_GITHUB_URL=https://github.com/SEU_USUARIO/amigo-secreto`.

## 4. CI

Na aba Actions do repositório, verifique o workflow `CI`: instalação, verificação de tipos e build. O workflow é de validação, não faz deploy.

## 5. Cloudflare

Deploy automático será configurado após decidir o nome público e conectar a conta Cloudflare. Não publique o protótipo como serviço de sorteio real: ele é uma demo local.
