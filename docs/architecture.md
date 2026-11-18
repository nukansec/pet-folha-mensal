# Arquitetura: PET-SD Folha Mensal

## 1. Visão geral

Aplicação Next.js 16 (App Router) de página única, renderizada no cliente
(`"use client"` em `src/app/page.tsx`). É **local-first**: não há banco de dados
nem backend de registros. O navegador guarda tudo e a folha oficial é impressa
pelo próprio navegador via CSS `@media print`.

```
src/
├── app/
│   ├── layout.tsx            # metadados (metadataBase = PROGRAM.links.site), tema, Analytics
│   ├── page.tsx              # estado da sessão, lançamentos, cópia, impressão
│   ├── favicon.ico, icon.png, apple-icon.png  # ícones gerados por scripts/brand/gerar-marca.py
│   ├── globals.css           # tokens de tema, layout e regras de impressão
│   ├── design-pet-sd.css     # layout do novo design (carregado depois do globals.css)
│   └── api/admin/session/    # única rota de servidor: sessão do painel local
├── config/program.ts         # dados do programa (ver ADR 0001)
├── components/               # telas, formulários, modais e folha oficial
├── context/DialogContext.tsx # alert/confirm acessíveis
├── lib/
│   ├── pet-calculator.ts     # CH exata, formatação, datas e vigência
│   ├── storage.ts            # localStorage (_v3), migração do _v2, cópia 1.3
│   ├── attachments*.ts       # comprovantes (IndexedDB), PDF.js, impressão
│   ├── admin-auth.ts         # hash da frase e sessão assinada (HMAC)
│   └── releases.ts, theme.ts
└── types/index.ts            # tipos e padrões derivados da config

public/images/pet-sd/          # logo, símbolo e imagem de compartilhamento (gerados por
                               # scripts/brand/gerar-marca.py) e faixa de logos da ficha
```

## 2. Configuração do programa

`src/config/program.ts` concentra nome, edital, instituições, vigência, meta (32 h),
prazo exibido, modalidades, perfis, os 13 GATs, modelos rápidos, links opcionais
e os textos da folha. `src/types/index.ts` deriva `DEFAULT_GATS` e
`DEFAULT_ROLES` dela; `storage.ts` deriva `DEFAULT_TEMPLATES`. Decisão e
trade-offs: [ADR 0001](adr/0001-config-central-do-programa.md).

## 3. Modelo de dados

```ts
interface UserProfile {
  id: string; name: string; email?: string;
  role: string;            // um dos perfis da ficha (editável no painel)
  gatNumber: string;       // "01".."13"
  gatName?: string; createdAt: string;
}

interface Activity {
  id: string;
  date: string;            // YYYY-MM-DD
  start: string; end: string;  // HH:MM
  modality: string;        // PROGRAM.modalities
  description: string;     // coluna "Atividade Desenvolvida"
  local: string;           // coluna "Unidade/Local" ("" se não se aplica)
  descricao: string;       // coluna "Descrição"
  hours: number;           // minutos/60, mantido por compatibilidade
}
```

## 4. Cálculo de carga horária

`calcPetMinutes(início, fim)` devolve a diferença exata em minutos (0 se o fim
não for posterior ao início ou se o horário for inválido). O total do mês é
`sumActivityMinutes`, uma soma de inteiros: somar horas decimais acumularia erro
de ponto flutuante (três atividades de 20 min = 0,333… h cada). A exibição usa
`formatDuration` (`2h`, `1h30`) e `formatTotalHours` (`34 horas`, `33h30`).

## 5. Armazenamento

| Onde | Chave | Conteúdo |
|---|---|---|
| localStorage | `pet_folha_profiles_v3` | perfis |
| localStorage | `pet_folha_active_profile_id_v3` | perfil aberto |
| localStorage | `pet_folha_activities_v3_<perfil>_<AAAA-MM>` | atividades do mês |
| localStorage | `pet_folha_config_{gats,roles,templates}_v3` | personalizações do painel |
| localStorage | `pet_folha_migrated_from_v2` | marca da migração |
| IndexedDB | `pet-folha-comprovantes` | comprovantes por perfil e mês |

**Migração `_v2` → `_v3`** (`migrateFromV2`, chamada na primeira leitura):
copia perfis e atividades uma única vez, troca perfis e modalidades antigos
pelos da ficha, preenche `local` e `descricao` com `""` e recalcula a CH. Não
apaga as chaves `_v2` e não sobrescreve chaves `_v3` existentes, então um erro
na migração não perde dados. Personalizações de GATs, perfis e modelos do
programa anterior não são copiadas.

**Cópia de segurança** (`exportUserData`/`inspectUserData`/`applyUserData`):
JSON versão `1.3` com perfil, mês, atividades e, opcionalmente, comprovantes em
base64. Versões 1.0–1.2 continuam aceitas (campos novos vazios; o `formReport`
das 1.2 é ignorado). A validação completa acontece antes de qualquer escrita, e
a restauração é transacional: se uma escrita falha, as anteriores são revertidas.

## 6. Folha oficial e impressão

`OfficialSheet.tsx` reproduz o modelo do PET-SD. Uma tabela externa com `<thead>`
contém a faixa de logos, que o navegador repete no topo de cada página impressa
(como o cabeçalho do Word); a tabela de atividades também repete a linha de
títulos. As larguras das oito colunas vêm do `w:gridCol` do `.docx` oficial. A
página é `@page { size: letter landscape }`. Os comprovantes são rasterizados no
cliente (PDF.js para PDFs) e entram como páginas depois da folha.

## 7. Segurança e privacidade

- Nenhum registro sai do navegador. A rota `/api/admin/session` só compara o hash
  SHA-256 da frase com `ADMIN_PIN_HASH` (comparação em tempo constante) e emite um
  cookie de sessão assinado com `ADMIN_SESSION_SECRET` por 8 horas. Sem as duas
  variáveis, o painel fica fechado. O painel protege contra acesso casual; os
  dados continuam no navegador de quem usa.
- Detalhes de suporte da restauração são uma lista fixa de campos, sem conteúdo
  do arquivo nem exceções brutas.
- O repositório é público: testes, exemplos e capturas usam dados fictícios.
