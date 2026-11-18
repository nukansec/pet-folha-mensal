import { Clock3, MapPin, Shapes, Video } from "lucide-react";
import { PROGRAM } from "@/config/program";
import { ChoiceGroup } from "@/components/ui/choice-group";

function modalityIcon(name: string) {
  if (/in loco/i.test(name)) return <MapPin size={18} />;
  if (/^ass[íi]ncrona/i.test(name)) return <Clock3 size={18} />;
  if (/s[íi]ncrona/i.test(name)) return <Video size={18} />;
  return <Shapes size={18} />;
}

/**
 * Modalidade como escolha visível: rótulo curto e ícone na tela; o nome
 * completo (PROGRAM.modalities) é o valor gravado, o nome acessível e o texto
 * da folha. Uma modalidade fora da lista (dado antigo ou personalizado)
 * aparece como opção extra, como no select de antes.
 */
export function ModalityChoice({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const names = Array.from(new Set([...PROGRAM.modalities, value].filter(Boolean)));
  return (
    <div className="field choice-field">
      <span className="field-legend" id={`${id}-label`}>
        Modalidade
      </span>
      <ChoiceGroup
        name={id}
        labelledBy={`${id}-label`}
        variant="segmented"
        className="modality-choice"
        value={value}
        onChange={onChange}
        options={names.map((name) => ({
          value: name,
          label: PROGRAM.modalityShortLabels[name] ?? name,
          accessibleLabel: name,
          icon: modalityIcon(name),
        }))}
      />
    </div>
  );
}
