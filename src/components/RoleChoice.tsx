import { ChoiceGroup } from "@/components/ui/choice-group";

/**
 * Perfil do participante (Coordenador(a), Tutor(a)…) em cartões de rádio.
 * Os valores são os nomes da lista de perfis (PROGRAM.roles ou os da
 * configuração local), os mesmos que a folha marca com X.
 */
export function RoleChoice({
  id,
  roles,
  value,
  onChange,
}: {
  id: string;
  roles: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const options = Array.from(new Set([...roles, value].filter(Boolean)));
  return (
    <div className="field choice-field">
      <span className="field-legend" id={`${id}-label`}>
        Perfil
      </span>
      <ChoiceGroup
        name={id}
        labelledBy={`${id}-label`}
        variant="cards"
        className="role-choice"
        value={value}
        onChange={onChange}
        options={options.map((role) => ({ value: role, label: role }))}
      />
    </div>
  );
}
