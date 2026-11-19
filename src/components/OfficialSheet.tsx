'use client';

import React from 'react';
import { Activity, UserProfile } from '@/types';
import { PROGRAM } from '@/config/program';
import {
  calcPetMinutes,
  sumActivityMinutes,
  formatDayMonth,
  formatDuration,
  formatTotalHours,
  sheetCell,
  sortActivitiesChronologically,
} from '@/lib/pet-calculator';

interface OfficialSheetProps {
  user?: UserProfile;
  monthLabel?: string;
  activities?: Activity[];
  totalMinutes?: number;
  isBlankTemplate?: boolean;
}

// Larguras das 8 colunas do modelo oficial (w:gridCol, em twips; total 13562).
const COLUMNS: Array<[string, number]> = [
  ['Data', 761],
  ['Unidade/Local', 1729],
  ['Atividade Desenvolvida', 2144],
  ['Início', 754],
  ['Fim', 844],
  ['CH (h)', 993],
  ['Modalidade', 1701],
  ['Descrição', 4636],
];
const TOTAL_TWIPS = COLUMNS.reduce((sum, [, width]) => sum + width, 0);
const BLANK_ROWS = 12;
const MIN_FILLED_ROWS = 8;

function gatLabel(gatNumber?: string) {
  if (!gatNumber) return '';
  const numeric = Number(gatNumber);
  return Number.isInteger(numeric) ? String(numeric) : gatNumber;
}

/**
 * Reprodução do "REGISTRO DE FREQUÊNCIA E ATIVIDADES – PET-SD" (Carta paisagem).
 * A tabela externa repete a faixa de logos em cada página impressa, como o
 * cabeçalho do Word; a tabela de atividades repete a linha de títulos.
 */
export function OfficialSheet({
  user,
  monthLabel = '',
  activities = [],
  totalMinutes,
  isBlankTemplate = false,
}: OfficialSheetProps) {
  const sortedActivities = React.useMemo(
    () => (isBlankTemplate ? [] : sortActivitiesChronologically(activities)),
    [activities, isBlankTemplate],
  );
  const emptyRows = isBlankTemplate
    ? BLANK_ROWS
    : Math.max(1, MIN_FILLED_ROWS - sortedActivities.length);
  const total = totalMinutes ?? sumActivityMinutes(sortedActivities);
  const role = isBlankTemplate ? '' : user?.role ?? '';

  return (
    <div className="official-sheet pet-sheet">
      <table className="pet-sheet-frame" role="presentation">
        <thead>
          <tr>
            <td>
              <div className="pet-sheet-header">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={PROGRAM.sheet.headerImage}
                  alt={PROGRAM.sheet.headerImageAlt}
                />
              </div>
            </td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <h1 className="pet-sheet-title">{PROGRAM.sheet.title}</h1>

              <table className="pet-sheet-identification">
                <colgroup>
                  <col style={{ width: '14.7%' }} />
                  <col />
                </colgroup>
                <tbody>
                  <tr>
                    <th scope="row">Nome:</th>
                    <td>{isBlankTemplate ? '' : user?.name?.toLocaleUpperCase('pt-BR')}</td>
                  </tr>
                  <tr>
                    <th scope="row">GAT:</th>
                    <td>{isBlankTemplate ? '' : gatLabel(user?.gatNumber)}</td>
                  </tr>
                  <tr>
                    <th scope="row">Perfil:</th>
                    <td className="pet-sheet-roles">
                      {PROGRAM.roles.map((item) => (
                        <span key={item}>
                          ( {item === role ? 'X' : '  '} ) {item}
                        </span>
                      ))}
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">Mês de Referência:</th>
                    <td>{isBlankTemplate ? '' : monthLabel}</td>
                  </tr>
                </tbody>
              </table>

              <table className="official-table pet-sheet-activities">
                <colgroup>
                  {COLUMNS.map(([label, width]) => (
                    <col
                      key={label}
                      style={{ width: `${((width / TOTAL_TWIPS) * 100).toFixed(2)}%` }}
                    />
                  ))}
                </colgroup>
                <thead>
                  <tr>
                    {COLUMNS.map(([label]) => (
                      <th key={label} scope="col">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedActivities.map((act) => (
                    <tr key={act.id}>
                      {/* Campo vazio sai como "-" para não parecer esquecido. */}
                      <td>{sheetCell(formatDayMonth(act.date))}</td>
                      <td>{sheetCell(act.local)}</td>
                      <td>{sheetCell(act.description)}</td>
                      <td>{sheetCell(act.start)}</td>
                      <td>{sheetCell(act.end)}</td>
                      <td>{formatDuration(calcPetMinutes(act.start, act.end))}</td>
                      <td>{sheetCell(act.modality)}</td>
                      <td className="pet-sheet-description">{sheetCell(act.descricao)}</td>
                    </tr>
                  ))}
                  {Array.from({ length: emptyRows }).map((_, i) => (
                    <tr key={`empty-${i}`} className="pet-sheet-empty-row">
                      {COLUMNS.map(([label]) => (
                        <td key={label} />
                      ))}
                    </tr>
                  ))}
                  <tr className="pet-sheet-total">
                    <td colSpan={COLUMNS.length}>
                      Total de CH no mês:{' '}
                      {isBlankTemplate ? ' '.repeat(8) + ' horas' : formatTotalHours(total)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="official-sheet-closing pet-sheet-closing">
                <p className="pet-sheet-note">{PROGRAM.sheet.deadlineNote}</p>
                <p className="pet-sheet-signature">{PROGRAM.sheet.participantSignature}</p>
                <p className="pet-sheet-signature">{PROGRAM.sheet.responsibleSignature}</p>
              </div>

              <section className="pet-sheet-instructions" aria-label="Instruções de preenchimento">
                <h2>Instruções de preenchimento</h2>
                <ol>
                  {PROGRAM.sheet.instructions.map((item, index) => (
                    <li key={item}>
                      {index + 1}) {item}
                    </li>
                  ))}
                </ol>
              </section>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
