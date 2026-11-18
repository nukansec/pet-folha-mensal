# Validação visual: novo design do PET-SD (18/11/2026)

Capturas feitas com `scripts/capturar-telas.mjs` (Playwright, Chromium), em
1440 e 390 px, temas claro e escuro, com **dados 100% fictícios** (perfil
“Pessoa Fictícia de Exemplo com Nome Comprido”, 8 atividades em outubro/2026).
JPEG com qualidade 70 para não pesar no repositório.

| Pasta | Origem |
| --- | --- |
| `antes/clima/` | referência de layout: https://pet-folha-mensal.vercel.app (PET-Saúde Clima) |
| `antes/pet-sd/` | produção do PET-SD antes desta branch: https://pet-folha-mensal-three.vercel.app (endereço antigo) |
| `depois/pet-sd/` | esta branch, `npm run build` e `next start` locais |
| `comparacao/` | as três lado a lado (Clima, antes, depois), por tela, tema e largura |

Cada pasta de captura tem um `resumo.txt`. O Clima não tem modal “Concluir”
(lá é “Conferir folha”) nem “Configurações” fora do menu do perfil; essas telas
aparecem como `ausente` no resumo dele.

No desktop, o Clima mostra 20 h para as mesmas 8 atividades e o PET-SD mostra
19 h: o Clima arredonda (hora iniciada conta inteira) e o PET-SD conta o tempo
exato. Diferença esperada.

## Regenerar

```bash
node scripts/capturar-telas.mjs clima https://pet-folha-mensal.vercel.app docs/validation/design-20261118/antes/clima
npm run build && npm start        # outro terminal, porta 5000
node scripts/capturar-telas.mjs pet-sd http://127.0.0.1:5000 docs/validation/design-20261118/depois/pet-sd
python scripts/montar-comparacao.py docs/validation/design-20261118
```

## Ajustes de 18/11/2026 (`ajustes/`)

Telas alteradas pelos ajustes A1–A10 (registro em `docs/design-pet-sd.md`,
seção “Ajustes de 18/11”), em 1440 e 390 px, claro e escuro, com perfil e
atividades fictícios: `entrada-topo-*` (sem o “?” e cartão de exemplo em
ordem), `cartoes-pdf-json-*`, `painel-*` (o `painel-claro-1440` é a captura do
README), `formulario-vazio-*` (CH “—”), `formulario-visita-tecnica-*` (modelo
sem local, In Loco) e `modal-rascunho-*` (botões dentro da caixa).

```bash
npm run build && npm start        # outro terminal, porta 5000
node scripts/capturar-ajustes.mjs http://127.0.0.1:5000 docs/validation/design-20261118/ajustes
```
