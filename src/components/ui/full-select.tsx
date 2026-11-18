import { Children, isValidElement, type ComponentProps, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/** Texto de um <option> escrito em JSX (string ou pedaços de string). */
function optionText(children: ReactNode): string {
  return Children.toArray(children)
    .map((part) => (typeof part === "string" || typeof part === "number" ? String(part) : ""))
    .join("");
}

/**
 * Select nativo que mostra a opção escolhida inteira, com quebra de linha.
 *
 * Um <select> nativo não quebra o texto: nomes longos de GAT ou de modelo
 * ficavam cortados em 390 px, e a fonte não pode baixar de 16 px (o iOS
 * aproxima a tela em campos menores). O select continua no lugar, transparente
 * por cima da caixa, então foco, teclado, rótulo e leitor de tela seguem
 * nativos; a caixa visível só repete o texto da opção (aria-hidden).
 */
export function FullSelect({ className = "", children, value, ...props }: ComponentProps<"select">) {
  // Como no select nativo: a opção com o valor atual ou, sem ela, a primeira.
  let first: string | undefined;
  let selected: string | undefined;
  Children.forEach(children, (child) => {
    if (!isValidElement<ComponentProps<"option">>(child) || child.type !== "option") return;
    const text = optionText(child.props.children);
    const optionValue = child.props.value !== undefined ? String(child.props.value) : text;
    first ??= text;
    if (selected === undefined && optionValue === String(value ?? "")) selected = text;
  });
  const label = selected ?? first ?? "";
  return (
    <span className={`full-select ${className}`}>
      <span className="full-select-display" aria-hidden="true">
        <span>{label}</span>
        <ChevronDown size={18} />
      </span>
      <select value={value} {...props}>
        {children}
      </select>
    </span>
  );
}
