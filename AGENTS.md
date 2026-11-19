# PET-SD Folha Mensal: contrato para agentes

Aplicação de registro mensal de frequência e atividades do **PET-Saúde:
Informação e Saúde Digital (PET-SD) UFG 2025–2027** (Edital Conjunto
SEIDIGI/SGTES-MS nº 1/2025; Ministério da Saúde, UFG e SMS Goiânia). Fork de
`vvvvvdal/pet-folha-mensal`; créditos no `README.md`. Deploy na Vercel.

## 1. Fonte da verdade

- Dados do programa (nome, edital, GATs, perfis, modalidades, meta, prazo, links,
  textos da folha): `src/config/program.ts`. Não espalhe esses textos em
  componentes; leia da config. Motivo: `docs/adr/0001-config-central-do-programa.md`.
- Registro da adaptação, decisões, dúvidas e divergências entre fontes:
  `docs/adaptacao-pet-sd.md`. Resumo das normas: `docs/regimento-pet.md`.

## 2. Regras de negócio

1. **Ficha**: "REGISTRO DE FREQUÊNCIA E ATIVIDADES – PET-SD", Carta paisagem.
   Campos Nome, GAT, Perfil (caixas Coordenador(a), Tutor(a), Preceptor(a),
   Orientador(a) de serviço, Monitor(a); o do participante marcado com X) e Mês de
   Referência. Colunas: Data | Unidade/Local | Atividade Desenvolvida | Início |
   Fim | CH (h) | Modalidade | Descrição. Rodapé com "Total de CH no mês", nota de
   prazo, assinaturas do participante e do responsável e página de instruções.
2. **CH exata**: `fim − início` em minutos, sem arredondamento
   (16:30–18:00 = `1h30`; 11:00–13:00 = `2h`). Fim antes do início = passou da
   meia-noite e conta inteira no dia em que começou (23:00–03:00 = `4h`), até
   12 h; acima disso, ou fim igual ao início, vale 0. Some minutos inteiros
   (`sumActivityMinutes`), nunca horas decimais. **Não** use a regra do projeto
   original (`CEILING(saída) − FLOOR(chegada)`).
3. **Meta**: mínimo de 32 h no mês, das quais 16 h em atividades Síncronas ou
   In Loco (`synchronousTargetHours` e `synchronousModalities` na config, por
   nome); o excedente não passa para o mês seguinte.
4. **Modalidades**: as da config (padrão: "Interação em tempo real (Síncrona)" e
   "Assíncrona"). Atividades presenciais e in loco exigem comprovação fotográfica.
5. **Prazo**: o rodapé da folha reproduz o texto do modelo (1º dia útil do mês
   seguinte); o prazo exibido no app vem da config.
6. **Datas livres**: cada GAT fecha a folha num dia (26 a 25, 20 a 19…). A data
   da atividade é livre dentro da vigência e a atividade fica na folha em que foi
   lançada; não recorte período nem mova atividades entre folhas. Motivo:
   `docs/adr/0002-datas-livres-na-folha.md`.

## 3. Dados, privacidade e LGPD

- Local-first: `localStorage` (chaves `_v3`) e IndexedDB para comprovantes. Mudou
  o formato salvo? Suba o sufixo das chaves e escreva migração não destrutiva
  (ver `migrateFromV2` em `src/lib/storage.ts`) e teste em `scripts/verify-ui.mjs`.
- Repositório **público**: exemplos, seeds, testes e capturas 100% fictícios.
  Nunca inclua nomes de integrantes, dados de participantes ou qualquer dado
  derivado de prontuário.
- Nunca leia, crie ou edite `.env` com valores; só `.env.example`, sem valores.
  `ADMIN_PIN_HASH` e `ADMIN_SESSION_SECRET` são citados apenas pelo nome.

## 4. Stack e verificações

- Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4.
- Antes de concluir: `npm run lint`, `npm run typecheck`, `npm run test:ui`,
  `npm run build` e `npm run test:e2e` (o CI roda os mesmos comandos).

## 5. Git

- GitHub Flow: uma branch por tarefa (`feat/`, `fix/`, `docs/`); nada direto na `main`.
- Conventional Commits em português (`feat:`, `fix:`, `docs:`, `refactor:`,
  `test:`, `chore:`).
- Sem coautoria nem menção a ferramentas de IA em commits, PRs, código ou docs.
- Push, PR e release só com pedido do mantenedor. Nunca envie nada ao remoto
  `upstream` (projeto original).
- Antes de commitar: `git status` e `git diff --cached` procurando segredos e
  dados pessoais.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
