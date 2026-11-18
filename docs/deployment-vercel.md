# Deploy na Vercel

O app é um projeto Next.js sem banco de dados. A Vercel detecta o framework e
roda `npm run build`; não há outra infraestrutura.

## 1. Criar o projeto

1. Faça push da branch e abra o PR para a `main` do fork; confira o CI
   (`.github/workflows/ci.yml`: lint, test:ui, test:contrast, build, typecheck e e2e).
2. Em [vercel.com/new](https://vercel.com/new), importe o repositório do fork.
3. Configuração detectada: Framework `Next.js`, Root Directory `./`, Build
   Command `next build`. A versão do Node vem de `package.json` (`22.x`).
4. Configure as variáveis abaixo e clique em **Deploy**. Pushes na `main`
   publicam em produção; PRs ganham URLs de pré-visualização.

Pela CLI, opcionalmente: `npx vercel` (pré-visualização) e `npx vercel --prod`.

## 2. Variáveis de ambiente

O app abre sem variáveis. Elas só liberam o **painel de configurações locais**
(GATs, perfis e modelos); sem elas, o painel fica fechado.

| Variável | Para quê |
|---|---|
| `ADMIN_PIN_HASH` | hash SHA-256 (hexadecimal) da frase de acesso ao painel; lido só no servidor |
| `ADMIN_SESSION_SECRET` | segredo aleatório (mínimo de 32 caracteres) que assina a sessão de 8 horas |

Gere os valores no seu terminal, sem gravá-los em arquivo versionado:

```bash
printf %s 'UMA FRASE LONGA E EXCLUSIVA' | sha256sum   # ADMIN_PIN_HASH (só o hexadecimal)
openssl rand -hex 32                                    # ADMIN_SESSION_SECRET
```

- Não use o prefixo `NEXT_PUBLIC_`: ele colocaria o valor no JavaScript enviado
  ao navegador.
- Para desenvolvimento local, copie `.env.example` para `.env.local` e preencha;
  `.env*` está no `.gitignore`.

## 3. Endereço

Produção: **https://pet-sd-folha-mensal.vercel.app**. O endereço anterior
(`pet-folha-mensal-three.vercel.app`, endereço antigo) foi trocado em
18/11/2026 no painel da Vercel, em **Settings → Domains**: o novo domínio entrou
como principal e o antigo ficou com **redirect 308** (permanente) para ele, então
links antigos continuam funcionando. No código, o endereço fica só em
`PROGRAM.links.site` (`src/config/program.ts`), que alimenta o `metadataBase` de
`src/app/layout.tsx` (URLs absolutas do Open Graph e da imagem de
compartilhamento). Ao trocar de novo: atualizar o domínio na Vercel e esse
campo; `npm run test:ui` falha se outro arquivo de `src/` tiver um `vercel.app`.

## 4. Analytics

`<Analytics />` (`@vercel/analytics`) está em `src/app/layout.tsx`. Para ver os
dados, ative **Analytics** no painel do projeto na Vercel. A coleta é agregada e
sem cookies.

## 5. Impressão

A folha é gerada no navegador do participante (`@page { size: letter landscape }`),
sem funções serverless nem navegador no servidor.

## 6. Antes de divulgar

- Conferir o CI verde no PR e a pré-visualização da Vercel.
- Aprovar a identidade visual (logo, cores, faixa de logos) com a coordenação
  do GAT, como pede o regimento.
