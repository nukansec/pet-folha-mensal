# Como colaborar

Obrigado por contribuir com o PET-SD Folha Mensal. Leia também o
[AGENTS.md](AGENTS.md), que resume as regras de negócio e de privacidade.

## 1. Princípios

- **Fidelidade à ficha oficial.** A folha impressa segue o modelo “Registro de
  Frequência e Atividades – PET-SD” em Carta paisagem. Mudanças em
  `OfficialSheet.tsx` ou no CSS de impressão precisam de comparação visual
  (`scripts/capture-validation.mjs`).
- **Regras do programa em um lugar.** Textos e regras do PET-SD vivem em
  `src/config/program.ts`; não repita esses textos em componentes.
- **CH exata.** `fim − início` em minutos, somada em inteiros. Nada de
  arredondar horas.
- **Local-first e privacidade.** Registros ficam no navegador. O repositório é
  público: exemplos, testes, capturas e issues usam só dados fictícios. Nunca
  inclua nomes de integrantes, dados de participantes ou de pacientes.
- **Celular primeiro.** Alvos de toque de pelo menos 44 px, texto de pelo menos
  16 px em campos e sem rolagem horizontal da página.

## 2. Fluxo de Git (GitHub Flow)

```bash
git switch main
git pull --ff-only origin main
git switch -c feat/descricao-curta      # ou fix/, docs/, test/, chore/
```

Antes de cada commit:

```bash
git status --short
git diff --cached                        # procure segredos e dados pessoais
git diff --check
```

### Commits

Conventional Commits em português, mensagens curtas e atômicas:

```text
feat(folha): repetir faixa de logos em cada página
fix(ch): somar minutos inteiros no total do mês
docs(regimento): atualizar prazo de entrega
test(storage): cobrir migração do formato _v2
```

Commits saem em nome de quem contribui, sem coautoria automática nem menção a
ferramentas de IA. Abra PR para a `main`; não faça commit direto nela.

## 3. Verificações obrigatórias

As mesmas do CI (`.github/workflows/ci.yml`):

```bash
npm ci
npm run lint
npm run typecheck
npm run test:ui
npm run test:contrast
npm run build
npx playwright install chromium   # uma vez
npm run test:e2e
```

## 4. Estrutura

- `src/config/program.ts`: dados do programa.
- `src/app/`: layout, página principal, ícone, CSS global e rota do painel.
- `src/components/`: telas, formulários, modais e `OfficialSheet.tsx`.
- `src/lib/`: cálculo de CH, armazenamento e migração, comprovantes, sessão do painel.
- `scripts/verify-ui.mjs`: testes unitários; `tests/e2e/`: Playwright.
- `scripts/capture-validation.mjs`: capturas para `docs/validation/`.
- `scripts/gerar-modelo-em-branco.py`: gera o modelo em branco a partir da ficha
  oficial (a ficha de origem não entra no repositório).
- `public/images/pet-sd/` e `public/templates/`: faixa de logos e modelos em branco.

## 5. Critérios para merge

1. Todas as verificações da seção 3 passando.
2. Documentação em `docs/` atualizada quando mudar regra, dado salvo ou folha.
3. Mudou o formato salvo? Sufixo novo nas chaves e migração não destrutiva, com teste.
4. Nenhum segredo, `.env` com valores ou dado pessoal no diff.
