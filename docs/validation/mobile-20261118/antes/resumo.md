# Auditoria de telas · 2026-11-19

347 ocorrências, 68 únicas (checagem + seletor + viewport).

| checagem | ocorrências |
| --- | --- |
| alvo-pequeno | 168 |
| palavra-partida | 50 |
| erro-console | 30 |
| modal-rodape-fora-da-tela | 30 |
| texto-cortado | 30 |
| reticencias-com-title | 27 |
| axe:label-content-name-mismatch | 6 |
| rolagem-horizontal | 5 |
| modal-mais-largo | 1 |

| checagem | viewport | temas | telas | seletor | texto | detalhe |
| --- | --- | --- | --- | --- | --- | --- |
| alvo-pequeno | 390-zoom200 | claro | entrada-continuar, entrada-primeiro-acesso, entrada-restaurar, aviso-restauracao | `div.ui-frame > div.ui-frame-panel > div.ui-segmented > button` | Continuar | 32×63 |
| alvo-pequeno | 320 | claro, escuro | painel, resumo-semanal, menu-participante, folha-minha, folha-modelo-em-branco | `header.workspace-nav > div.workspace-nav-bottom > nav.workspace-tabs > button` | Minha frequência | 137×41 |
| alvo-pequeno | 360 | claro, escuro | painel, resumo-semanal, menu-participante, folha-minha, folha-modelo-em-branco | `header.workspace-nav > div.workspace-nav-bottom > nav.workspace-tabs > button` | Minha frequência | 157×41 |
| alvo-pequeno | 390 | claro, escuro | painel, resumo-semanal, menu-participante, folha-minha, folha-modelo-em-branco | `header.workspace-nav > div.workspace-nav-bottom > nav.workspace-tabs > button` | Minha frequência | 172×41 |
| alvo-pequeno | 414 | claro, escuro | painel, resumo-semanal, menu-participante, folha-minha, folha-modelo-em-branco | `header.workspace-nav > div.workspace-nav-bottom > nav.workspace-tabs > button` | Minha frequência | 184×41 |
| alvo-pequeno | 768 | claro, escuro | painel, resumo-semanal, menu-participante, folha-minha, folha-modelo-em-branco | `header.workspace-nav > div.workspace-nav-bottom > nav.workspace-tabs > button` | Minha frequência | 195×42 |
| alvo-pequeno | 740x360 | claro, escuro | painel, resumo-semanal, menu-participante, folha-minha, folha-modelo-em-branco | `header.workspace-nav > div.workspace-nav-bottom > nav.workspace-tabs > button` | Minha frequência | 347×41 |
| alvo-pequeno | 1440 | claro, escuro | painel, resumo-semanal, menu-participante, folha-minha, folha-modelo-em-branco | `header.workspace-nav > div.workspace-nav-bottom > nav.workspace-tabs > button` | Minha frequência | 195×42 |
| alvo-pequeno | 390-zoom200 | claro | painel, resumo-semanal, menu-participante, folha-minha, folha-modelo-em-branco | `header.workspace-nav > div.workspace-nav-bottom > nav.workspace-tabs > button` | Minha frequência | 75×41 |
| alvo-pequeno | 390-zoom200 | claro | painel, resumo-semanal, menu-participante | `input#activity-end` |  | 29×46 |
| alvo-pequeno | 390-zoom200 | claro | painel, resumo-semanal, menu-participante | `input#activity-start` |  | 29×46 |
| axe:label-content-name-mismatch | 360 | claro, escuro | entrada-continuar | `button[aria-describedby="profile-card-outra-pessoa"]` |  | serious · Elements must have their visible text as part of their accessible name |
| axe:label-content-name-mismatch | 1440 | claro | entrada-continuar | `button[aria-describedby="profile-card-outra-pessoa"]` |  | serious · Elements must have their visible text as part of their accessible name |
| axe:label-content-name-mismatch | 360 | claro, escuro | entrada-continuar | `button[aria-describedby="profile-card-pessoa-ficticia"]` |  | serious · Elements must have their visible text as part of their accessible name |
| axe:label-content-name-mismatch | 1440 | claro | entrada-continuar | `button[aria-describedby="profile-card-pessoa-ficticia"]` |  | serious · Elements must have their visible text as part of their accessible name |
| erro-console | 320 | claro, escuro | entrada-continuar, painel | `console` |  | HTTP 404 /_vercel/insights/script.js |
| erro-console | 360 | claro, escuro | entrada-continuar, painel | `console` |  | HTTP 404 /_vercel/insights/script.js |
| erro-console | 390 | claro, escuro | entrada-continuar, painel | `console` |  | HTTP 404 /_vercel/insights/script.js |
| erro-console | 414 | claro, escuro | entrada-continuar, painel | `console` |  | HTTP 404 /_vercel/insights/script.js |
| erro-console | 768 | claro, escuro | entrada-continuar, painel | `console` |  | HTTP 404 /_vercel/insights/script.js |
| erro-console | 740x360 | claro, escuro | entrada-continuar, painel | `console` |  | HTTP 404 /_vercel/insights/script.js |
| erro-console | 1440 | claro, escuro | entrada-continuar, painel | `console` |  | HTTP 404 /_vercel/insights/script.js |
| erro-console | 390-zoom200 | claro | entrada-continuar, painel | `console` |  | HTTP 404 /_vercel/insights/script.js |
| modal-mais-largo | 390-zoom200 | claro | modal-excluir-perfil | `html > body.min-h-screen.antialiased > dialog.pet-dialog.screen-only > section.conclusion-panel.delete-profile-panel` | Excluir o perfil de Pessoa Fictícia de Exemplo Sobrenome Lon | painel 199 px, viewport 195 |
| modal-rodape-fora-da-tela | 390-zoom200 | claro | modal-confirmar-exclusao, aviso-rascunho | `dialog.pet-dialog.screen-only > div.w-full.max-w-md > div.dialog-actions.pt-3 > button.px-5.py-2.5` | Sim, excluir | rodapé só aparece rolando (458 px > 422) |
| modal-rodape-fora-da-tela | 320 | claro, escuro | modal-concluir | `dialog.pet-dialog.screen-only > section.conclusion-panel > div.conclusion-actions > button.primary-button` | Sair / trocar participante | rodapé só aparece rolando (727 px > 640) |
| modal-rodape-fora-da-tela | 740x360 | claro, escuro | modal-concluir | `dialog.pet-dialog.screen-only > section.conclusion-panel > div.conclusion-actions > button.primary-button` | Sair / trocar participante | rodapé só aparece rolando (511 px > 360) |
| modal-rodape-fora-da-tela | 390-zoom200 | claro | modal-concluir | `dialog.pet-dialog.screen-only > section.conclusion-panel > div.conclusion-actions > button.primary-button` | Sair / trocar participante | rodapé só aparece rolando (1137 px > 422) |
| modal-rodape-fora-da-tela | 320 | claro, escuro | modal-excluir-perfil | `dialog.pet-dialog.screen-only > section.conclusion-panel.delete-profile-panel > div.dialog-actions > button.danger-button` | Excluir perfil | rodapé só aparece rolando (797 px > 640) |
| modal-rodape-fora-da-tela | 740x360 | claro, escuro | modal-excluir-perfil | `dialog.pet-dialog.screen-only > section.conclusion-panel.delete-profile-panel > div.dialog-actions > button.danger-button` | Excluir perfil | rodapé só aparece rolando (489 px > 360) |
| modal-rodape-fora-da-tela | 390-zoom200 | claro | modal-excluir-perfil | `dialog.pet-dialog.screen-only > section.conclusion-panel.delete-profile-panel > div.dialog-actions > button.danger-button` | Excluir perfil | rodapé só aparece rolando (1102 px > 535) |
| modal-rodape-fora-da-tela | 320 | claro, escuro | modal-editar-atividade | `div.w-full.max-w-2xl > form.space-y-4 > div.dialog-actions.pt-3 > button.px-5.py-2.5` | Salvar alterações | rodapé só aparece rolando (1274 px > 640) |
| modal-rodape-fora-da-tela | 360 | claro, escuro | modal-editar-atividade | `div.w-full.max-w-2xl > form.space-y-4 > div.dialog-actions.pt-3 > button.px-5.py-2.5` | Salvar alterações | rodapé só aparece rolando (1210 px > 780) |
| modal-rodape-fora-da-tela | 390 | claro, escuro | modal-editar-atividade | `div.w-full.max-w-2xl > form.space-y-4 > div.dialog-actions.pt-3 > button.px-5.py-2.5` | Salvar alterações | rodapé só aparece rolando (1166 px > 844) |
| modal-rodape-fora-da-tela | 414 | claro, escuro | modal-editar-atividade | `div.w-full.max-w-2xl > form.space-y-4 > div.dialog-actions.pt-3 > button.px-5.py-2.5` | Salvar alterações | rodapé só aparece rolando (1110 px > 896) |
| modal-rodape-fora-da-tela | 740x360 | claro, escuro | modal-editar-atividade | `div.w-full.max-w-2xl > form.space-y-4 > div.dialog-actions.pt-3 > button.px-5.py-2.5` | Salvar alterações | rodapé só aparece rolando (744 px > 360) |
| modal-rodape-fora-da-tela | 390-zoom200 | claro | modal-editar-atividade | `div.w-full.max-w-2xl > form.space-y-4 > div.dialog-actions.pt-3 > button.px-5.py-2.5` | Salvar alterações | rodapé só aparece rolando (1639 px > 422) |
| modal-rodape-fora-da-tela | 320 | claro, escuro | modal-identificacao | `div.w-full.max-w-md > form.space-y-4 > div.dialog-actions.pt-2 > button.px-5.py-2` | Salvar alterações | rodapé só aparece rolando (855 px > 640) |
| modal-rodape-fora-da-tela | 360 | claro, escuro | modal-identificacao | `div.w-full.max-w-md > form.space-y-4 > div.dialog-actions.pt-2 > button.px-5.py-2` | Salvar alterações | rodapé só aparece rolando (813 px > 780) |
| modal-rodape-fora-da-tela | 740x360 | claro, escuro | modal-identificacao | `div.w-full.max-w-md > form.space-y-4 > div.dialog-actions.pt-2 > button.px-5.py-2` | Salvar alterações | rodapé só aparece rolando (743 px > 360) |
| modal-rodape-fora-da-tela | 390-zoom200 | claro | modal-identificacao | `div.w-full.max-w-md > form.space-y-4 > div.dialog-actions.pt-2 > button.px-5.py-2` | Salvar alterações | rodapé só aparece rolando (1364 px > 422) |
| palavra-partida | 390-zoom200 | claro | entrada-primeiro-acesso | `div.field > span.full-select > span.full-select-display > span` | GAT 01 · Alerta de violências com IA | "violências" em 2 linhas |
| palavra-partida | 320 | claro, escuro | entrada-primeiro-acesso, modal-identificacao | `div.field.choice-field > div.choice-group.choice-group--cards > label.choice > span.choice-text` | Coordenador(a) | "Coordenador(a)" em 2 linhas |
| palavra-partida | 360 | claro, escuro | entrada-primeiro-acesso, modal-identificacao | `div.field.choice-field > div.choice-group.choice-group--cards > label.choice > span.choice-text` | Coordenador(a) | "Coordenador(a)" em 2 linhas |
| palavra-partida | 390-zoom200 | claro | entrada-primeiro-acesso, modal-identificacao | `div.field.choice-field > div.choice-group.choice-group--cards > label.choice > span.choice-text` | Coordenador(a) | "Coordenador(a)" em 5 linhas |
| palavra-partida | 390-zoom200 | claro | modal-editar-atividade | `div.field.choice-field > div.choice-group.choice-group--segmented > label.choice > span.choice-text` | Assíncrona | "Assíncrona" em 2 linhas |
| palavra-partida | 320 | claro, escuro | modal-editar-atividade | `div.flex.items-center > span.full-select.text-xs > span.full-select-display > span` | Selecionar modelo... | "Selecionar" em 3 linhas |
| palavra-partida | 360 | claro, escuro | modal-editar-atividade | `div.flex.items-center > span.full-select.text-xs > span.full-select-display > span` | Selecionar modelo... | "Selecionar" em 2 linhas |
| palavra-partida | 390-zoom200 | claro | modal-editar-atividade | `div.flex.items-center > span.full-select.text-xs > span.full-select-display > span` | Selecionar modelo... | "Selecionar" em 8 linhas |
| palavra-partida | 390-zoom200 | claro | painel, resumo-semanal, menu-participante, folha-minha, folha-modelo-em-branco | `div.participant-menu > button.profile-button > span > strong` | Pessoa Fictícia de Exemplo Sobrenome Longo | "Sobrenome" em 2 linhas |
| palavra-partida | 390-zoom200 | claro | painel, resumo-semanal, menu-participante | `div.summary-progress-head > div.choice-group.choice-group--toggle > label.choice > span.choice-text` | Mensal | "Mensal" em 3 linhas |
| palavra-partida | 390-zoom200 | claro | entrada-continuar | `li.profile-card > button.profile-card-open > span.profile-card-text > strong` | Pessoa Fictícia de Exemplo Sobrenome Longo | "Sobrenome" em 2 linhas |
| reticencias-com-title | 320 | claro, escuro | modal-identificacao | `div.field > span.full-select.full-select--single > span.full-select-display > span` | GAT 01 · Alerta de violências com IA | largura 272>178 |
| reticencias-com-title | 360 | claro, escuro | modal-identificacao | `div.field > span.full-select.full-select--single > span.full-select-display > span` | GAT 01 · Alerta de violências com IA | largura 272>218 |
| reticencias-com-title | 390 | claro, escuro | modal-identificacao | `div.field > span.full-select.full-select--single > span.full-select-display > span` | GAT 01 · Alerta de violências com IA | largura 272>248 |
| reticencias-com-title | 390-zoom200 | claro | modal-identificacao | `div.field > span.full-select.full-select--single > span.full-select-display > span` | GAT 01 · Alerta de violências com IA | largura 272>53 |
| reticencias-com-title | 768 | claro, escuro | painel, resumo-semanal, menu-participante, folha-minha, folha-modelo-em-branco | `div.participant-menu > button.profile-button > span > small` | Monitor(a) · GAT 01 · Alerta de violências com IA | largura 319>216 |
| reticencias-com-title | 768 | claro, escuro | painel, resumo-semanal, menu-participante, folha-minha, folha-modelo-em-branco | `div.participant-menu > button.profile-button > span > strong` | Pessoa Fictícia de Exemplo Sobrenome Longo | largura 333>216 |
| rolagem-horizontal | 390-zoom200 | claro | entrada-continuar, modal-excluir-perfil, entrada-primeiro-acesso, entrada-restaurar, aviso-restauracao | `header.entry-header > div.entry-header-inner > nav.entry-tools > button.icon-button` | Ativar tema escuro | scrollWidth 247 > 195; header.entry-header > div.entry-header-inner > nav.entry-tools > button.icon-button / nav.entry-tools > button.icon-button > svg.lucide.lucide-settings-2 > circle / nav.entry-tools > button.icon-button > svg.lucide.lucide-settings-2 > circle |
| texto-cortado | 390-zoom200 | claro | modal-configuracoes | `main#conteudo > dialog.pet-dialog.screen-only > div.w-full.max-w-4xl` | Configurações Locais Configurações Locais Digite o PIN para  | largura 240>145 |
| texto-cortado | 390-zoom200 | claro | painel, resumo-semanal, menu-participante | `main#conteudo > div > div.frequency-workbench > section.activity-list` | Atividades do mês 10 Limpar mês 03/11/2026 2h Reunião Geral  | largura 175>161 |
| texto-cortado | 320 | claro, escuro | folha-minha, folha-modelo-em-branco | `main#conteudo > div.space-y-4.animate-fade-in > div.sheet-stage.overflow-x-auto > div.rounded-xs.ring-1` | REGISTRO DE FREQUÊNCIA E ATIVIDADES – PET-SD Nome: PESSOA FI | largura 1050>266 |
| texto-cortado | 360 | claro, escuro | folha-minha, folha-modelo-em-branco | `main#conteudo > div.space-y-4.animate-fade-in > div.sheet-stage.overflow-x-auto > div.rounded-xs.ring-1` | REGISTRO DE FREQUÊNCIA E ATIVIDADES – PET-SD Nome: PESSOA FI | largura 1050>306 |
| texto-cortado | 390 | claro, escuro | folha-minha, folha-modelo-em-branco | `main#conteudo > div.space-y-4.animate-fade-in > div.sheet-stage.overflow-x-auto > div.rounded-xs.ring-1` | REGISTRO DE FREQUÊNCIA E ATIVIDADES – PET-SD Nome: PESSOA FI | largura 1050>336 |
| texto-cortado | 414 | claro, escuro | folha-minha, folha-modelo-em-branco | `main#conteudo > div.space-y-4.animate-fade-in > div.sheet-stage.overflow-x-auto > div.rounded-xs.ring-1` | REGISTRO DE FREQUÊNCIA E ATIVIDADES – PET-SD Nome: PESSOA FI | largura 1050>360 |
| texto-cortado | 768 | claro, escuro | folha-minha, folha-modelo-em-branco | `main#conteudo > div.space-y-4.animate-fade-in > div.sheet-stage.overflow-x-auto > div.rounded-xs.ring-1` | REGISTRO DE FREQUÊNCIA E ATIVIDADES – PET-SD Nome: PESSOA FI | largura 1050>638 |
| texto-cortado | 740x360 | claro, escuro | folha-minha, folha-modelo-em-branco | `main#conteudo > div.space-y-4.animate-fade-in > div.sheet-stage.overflow-x-auto > div.rounded-xs.ring-1` | REGISTRO DE FREQUÊNCIA E ATIVIDADES – PET-SD Nome: PESSOA FI | largura 1050>642 |
| texto-cortado | 390-zoom200 | claro | folha-minha, folha-modelo-em-branco | `main#conteudo > div.space-y-4.animate-fade-in > div.sheet-stage.overflow-x-auto > div.rounded-xs.ring-1` | REGISTRO DE FREQUÊNCIA E ATIVIDADES – PET-SD Nome: PESSOA FI | largura 1050>141 |

## Execução

    achados   1  320-claro/entrada-continuar
    achados   1  320-claro/modal-excluir-perfil
    achados   3  320-claro/entrada-primeiro-acesso
    ok        0  320-claro/entrada-restaurar
    ok        0  320-claro/aviso-restauracao
    achados   3  320-claro/painel
    achados   2  320-claro/resumo-semanal
    achados   2  320-claro/menu-participante
    achados   5  320-claro/modal-identificacao
    achados   3  320-claro/modal-editar-atividade
    ok        0  320-claro/modal-confirmar-exclusao
    achados   1  320-claro/modal-concluir
    ok        0  320-claro/modal-ajuda
    ok        0  320-claro/modal-configuracoes
    ok        0  320-claro/aviso-rascunho
    achados   3  320-claro/folha-minha
    achados   3  320-claro/folha-modelo-em-branco
    achados   1  320-escuro/entrada-continuar
    achados   1  320-escuro/modal-excluir-perfil
    achados   3  320-escuro/entrada-primeiro-acesso
    ok        0  320-escuro/entrada-restaurar
    ok        0  320-escuro/aviso-restauracao
    achados   3  320-escuro/painel
    achados   2  320-escuro/resumo-semanal
    achados   2  320-escuro/menu-participante
    achados   5  320-escuro/modal-identificacao
    achados   3  320-escuro/modal-editar-atividade
    ok        0  320-escuro/modal-confirmar-exclusao
    achados   1  320-escuro/modal-concluir
    ok        0  320-escuro/modal-ajuda
    ok        0  320-escuro/modal-configuracoes
    ok        0  320-escuro/aviso-rascunho
    achados   3  320-escuro/folha-minha
    achados   3  320-escuro/folha-modelo-em-branco
    achados   3  360-claro/entrada-continuar
    ok        0  360-claro/modal-excluir-perfil
    achados   1  360-claro/entrada-primeiro-acesso
    ok        0  360-claro/entrada-restaurar
    ok        0  360-claro/aviso-restauracao
    achados   3  360-claro/painel
    achados   2  360-claro/resumo-semanal
    achados   2  360-claro/menu-participante
    achados   3  360-claro/modal-identificacao
    achados   2  360-claro/modal-editar-atividade
    ok        0  360-claro/modal-confirmar-exclusao
    ok        0  360-claro/modal-concluir
    ok        0  360-claro/modal-ajuda
    ok        0  360-claro/modal-configuracoes
    ok        0  360-claro/aviso-rascunho
    achados   3  360-claro/folha-minha
    achados   3  360-claro/folha-modelo-em-branco
    achados   3  360-escuro/entrada-continuar
    ok        0  360-escuro/modal-excluir-perfil
    achados   1  360-escuro/entrada-primeiro-acesso
    ok        0  360-escuro/entrada-restaurar
    ok        0  360-escuro/aviso-restauracao
    achados   3  360-escuro/painel
    achados   2  360-escuro/resumo-semanal
    achados   2  360-escuro/menu-participante
    achados   3  360-escuro/modal-identificacao
    achados   2  360-escuro/modal-editar-atividade
    ok        0  360-escuro/modal-confirmar-exclusao
    ok        0  360-escuro/modal-concluir
    ok        0  360-escuro/modal-ajuda
    ok        0  360-escuro/modal-configuracoes
    ok        0  360-escuro/aviso-rascunho
    achados   3  360-escuro/folha-minha
    achados   3  360-escuro/folha-modelo-em-branco
    achados   1  390-claro/entrada-continuar
    ok        0  390-claro/modal-excluir-perfil
    ok        0  390-claro/entrada-primeiro-acesso
    ok        0  390-claro/entrada-restaurar
    ok        0  390-claro/aviso-restauracao
    achados   3  390-claro/painel
    achados   2  390-claro/resumo-semanal
    achados   2  390-claro/menu-participante
    achados   1  390-claro/modal-identificacao
    achados   1  390-claro/modal-editar-atividade
    ok        0  390-claro/modal-confirmar-exclusao
    ok        0  390-claro/modal-concluir
    ok        0  390-claro/modal-ajuda
    ok        0  390-claro/modal-configuracoes
    ok        0  390-claro/aviso-rascunho
    achados   3  390-claro/folha-minha
    achados   3  390-claro/folha-modelo-em-branco
    achados   1  390-escuro/entrada-continuar
    ok        0  390-escuro/modal-excluir-perfil
    ok        0  390-escuro/entrada-primeiro-acesso
    ok        0  390-escuro/entrada-restaurar
    ok        0  390-escuro/aviso-restauracao
    achados   3  390-escuro/painel
    achados   2  390-escuro/resumo-semanal
    achados   2  390-escuro/menu-participante
    achados   1  390-escuro/modal-identificacao
    achados   1  390-escuro/modal-editar-atividade
    ok        0  390-escuro/modal-confirmar-exclusao
    ok        0  390-escuro/modal-concluir
    ok        0  390-escuro/modal-ajuda
    ok        0  390-escuro/modal-configuracoes
    ok        0  390-escuro/aviso-rascunho
    achados   3  390-escuro/folha-minha
    achados   3  390-escuro/folha-modelo-em-branco
    achados   1  414-claro/entrada-continuar
    ok        0  414-claro/modal-excluir-perfil
    ok        0  414-claro/entrada-primeiro-acesso
    ok        0  414-claro/entrada-restaurar
    ok        0  414-claro/aviso-restauracao
    achados   3  414-claro/painel
    achados   2  414-claro/resumo-semanal
    achados   2  414-claro/menu-participante
    ok        0  414-claro/modal-identificacao
    achados   1  414-claro/modal-editar-atividade
    ok        0  414-claro/modal-confirmar-exclusao
    ok        0  414-claro/modal-concluir
    ok        0  414-claro/modal-ajuda
    ok        0  414-claro/modal-configuracoes
    ok        0  414-claro/aviso-rascunho
    achados   3  414-claro/folha-minha
    achados   3  414-claro/folha-modelo-em-branco
    achados   1  414-escuro/entrada-continuar
    ok        0  414-escuro/modal-excluir-perfil
    ok        0  414-escuro/entrada-primeiro-acesso
    ok        0  414-escuro/entrada-restaurar
    ok        0  414-escuro/aviso-restauracao
    achados   3  414-escuro/painel
    achados   2  414-escuro/resumo-semanal
    achados   2  414-escuro/menu-participante
    ok        0  414-escuro/modal-identificacao
    achados   1  414-escuro/modal-editar-atividade
    ok        0  414-escuro/modal-confirmar-exclusao
    ok        0  414-escuro/modal-concluir
    ok        0  414-escuro/modal-ajuda
    ok        0  414-escuro/modal-configuracoes
    ok        0  414-escuro/aviso-rascunho
    achados   3  414-escuro/folha-minha
    achados   3  414-escuro/folha-modelo-em-branco
    achados   1  768-claro/entrada-continuar
    ok        0  768-claro/modal-excluir-perfil
    ok        0  768-claro/entrada-primeiro-acesso
    ok        0  768-claro/entrada-restaurar
    ok        0  768-claro/aviso-restauracao
    achados   5  768-claro/painel
    achados   4  768-claro/resumo-semanal
    achados   4  768-claro/menu-participante
    ok        0  768-claro/modal-identificacao
    ok        0  768-claro/modal-editar-atividade
    ok        0  768-claro/modal-confirmar-exclusao
    ok        0  768-claro/modal-concluir
    ok        0  768-claro/modal-ajuda
    ok        0  768-claro/modal-configuracoes
    ok        0  768-claro/aviso-rascunho
    achados   5  768-claro/folha-minha
    achados   5  768-claro/folha-modelo-em-branco
    achados   1  768-escuro/entrada-continuar
    ok        0  768-escuro/modal-excluir-perfil
    ok        0  768-escuro/entrada-primeiro-acesso
    ok        0  768-escuro/entrada-restaurar
    ok        0  768-escuro/aviso-restauracao
    achados   5  768-escuro/painel
    achados   4  768-escuro/resumo-semanal
    achados   4  768-escuro/menu-participante
    ok        0  768-escuro/modal-identificacao
    ok        0  768-escuro/modal-editar-atividade
    ok        0  768-escuro/modal-confirmar-exclusao
    ok        0  768-escuro/modal-concluir
    ok        0  768-escuro/modal-ajuda
    ok        0  768-escuro/modal-configuracoes
    ok        0  768-escuro/aviso-rascunho
    achados   5  768-escuro/folha-minha
    achados   5  768-escuro/folha-modelo-em-branco
    achados   1  740x360-claro/entrada-continuar
    achados   1  740x360-claro/modal-excluir-perfil
    ok        0  740x360-claro/entrada-primeiro-acesso
    ok        0  740x360-claro/entrada-restaurar
    ok        0  740x360-claro/aviso-restauracao
    achados   3  740x360-claro/painel
    achados   2  740x360-claro/resumo-semanal
    achados   2  740x360-claro/menu-participante
    achados   1  740x360-claro/modal-identificacao
    achados   1  740x360-claro/modal-editar-atividade
    ok        0  740x360-claro/modal-confirmar-exclusao
    achados   1  740x360-claro/modal-concluir
    ok        0  740x360-claro/modal-ajuda
    ok        0  740x360-claro/modal-configuracoes
    ok        0  740x360-claro/aviso-rascunho
    achados   3  740x360-claro/folha-minha
    achados   3  740x360-claro/folha-modelo-em-branco
    achados   1  740x360-escuro/entrada-continuar
    achados   1  740x360-escuro/modal-excluir-perfil
    ok        0  740x360-escuro/entrada-primeiro-acesso
    ok        0  740x360-escuro/entrada-restaurar
    ok        0  740x360-escuro/aviso-restauracao
    achados   3  740x360-escuro/painel
    achados   2  740x360-escuro/resumo-semanal
    achados   2  740x360-escuro/menu-participante
    achados   1  740x360-escuro/modal-identificacao
    achados   1  740x360-escuro/modal-editar-atividade
    ok        0  740x360-escuro/modal-confirmar-exclusao
    achados   1  740x360-escuro/modal-concluir
    ok        0  740x360-escuro/modal-ajuda
    ok        0  740x360-escuro/modal-configuracoes
    ok        0  740x360-escuro/aviso-rascunho
    achados   3  740x360-escuro/folha-minha
    achados   3  740x360-escuro/folha-modelo-em-branco
    achados   3  1440-claro/entrada-continuar
    ok        0  1440-claro/modal-excluir-perfil
    ok        0  1440-claro/entrada-primeiro-acesso
    ok        0  1440-claro/entrada-restaurar
    ok        0  1440-claro/aviso-restauracao
    achados   3  1440-claro/painel
    achados   2  1440-claro/resumo-semanal
    achados   2  1440-claro/menu-participante
    ok        0  1440-claro/modal-identificacao
    ok        0  1440-claro/modal-editar-atividade
    ok        0  1440-claro/modal-confirmar-exclusao
    ok        0  1440-claro/modal-concluir
    ok        0  1440-claro/modal-ajuda
    ok        0  1440-claro/modal-configuracoes
    ok        0  1440-claro/aviso-rascunho
    achados   2  1440-claro/folha-minha
    achados   2  1440-claro/folha-modelo-em-branco
    achados   1  1440-escuro/entrada-continuar
    ok        0  1440-escuro/modal-excluir-perfil
    ok        0  1440-escuro/entrada-primeiro-acesso
    ok        0  1440-escuro/entrada-restaurar
    ok        0  1440-escuro/aviso-restauracao
    achados   3  1440-escuro/painel
    achados   2  1440-escuro/resumo-semanal
    achados   2  1440-escuro/menu-participante
    ok        0  1440-escuro/modal-identificacao
    ok        0  1440-escuro/modal-editar-atividade
    ok        0  1440-escuro/modal-confirmar-exclusao
    ok        0  1440-escuro/modal-concluir
    ok        0  1440-escuro/modal-ajuda
    ok        0  1440-escuro/modal-configuracoes
    ok        0  1440-escuro/aviso-rascunho
    achados   2  1440-escuro/folha-minha
    achados   2  1440-escuro/folha-modelo-em-branco
    achados   6  390-zoom200-claro/entrada-continuar
    achados   3  390-zoom200-claro/modal-excluir-perfil
    achados  11  390-zoom200-claro/entrada-primeiro-acesso
    achados   4  390-zoom200-claro/entrada-restaurar
    achados   4  390-zoom200-claro/aviso-restauracao
    achados   9  390-zoom200-claro/painel
    achados   8  390-zoom200-claro/resumo-semanal
    achados   8  390-zoom200-claro/menu-participante
    achados   8  390-zoom200-claro/modal-identificacao
    achados   4  390-zoom200-claro/modal-editar-atividade
    achados   1  390-zoom200-claro/modal-confirmar-exclusao
    achados   1  390-zoom200-claro/modal-concluir
    ok        0  390-zoom200-claro/modal-ajuda
    achados   1  390-zoom200-claro/modal-configuracoes
    achados   1  390-zoom200-claro/aviso-rascunho
    achados   4  390-zoom200-claro/folha-minha
    achados   4  390-zoom200-claro/folha-modelo-em-branco
