import type { ReactNode } from "react";

export interface ChoiceOption {
  value: string;
  /** Texto visível (pode ser curto). */
  label: ReactNode;
  /** Nome acessível quando o texto visível é abreviado (ex.: modalidade). */
  accessibleLabel?: string;
  icon?: ReactNode;
}

/**
 * Grupo de opções com rádios nativos dentro de role="radiogroup".
 *
 * O <input type="radio"> fica invisível por cima de cada cartão: o navegador
 * cuida das setas (movem e escolhem), do Tab (entra e sai do grupo pela opção
 * marcada), do anúncio "x de n" no leitor de tela e do envio do formulário.
 * O rótulo do grupo é um elemento visível ligado por aria-labelledby.
 *
 * variant: "segmented" (poucas opções lado a lado), "cards" (cartões em
 * grade) ou "chips" (pílulas; rolagem horizontal no celular).
 */
export function ChoiceGroup({
  name,
  labelledBy,
  value,
  options,
  onChange,
  variant,
  className = "",
}: {
  name: string;
  labelledBy: string;
  value: string;
  options: ChoiceOption[];
  onChange: (value: string) => void;
  variant: "segmented" | "cards" | "chips";
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      className={`choice-group choice-group--${variant} ${className}`}
    >
      {options.map((option) => {
        const checked = option.value === value;
        return (
          <label
            key={option.value}
            className="choice"
            data-checked={checked}
            title={option.accessibleLabel}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={checked}
              aria-label={option.accessibleLabel}
              onChange={() => onChange(option.value)}
            />
            {option.icon && (
              <span className="choice-icon" aria-hidden="true">
                {option.icon}
              </span>
            )}
            <span className="choice-text" aria-hidden={option.accessibleLabel ? true : undefined}>
              {option.label}
            </span>
          </label>
        );
      })}
    </div>
  );
}
