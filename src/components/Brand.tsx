import { PROGRAM } from "@/config/program";

// TODO(pet-sd): selo textual provisório; trocar pelo logo oficial do PET-SD/UFG.
export function Brand() {
  return (
    <span className="brand">
      <span className="brand-seal" aria-hidden="true">
        PET
        <br />
        SD
      </span>
      <span>
        <strong>
          {PROGRAM.acronym} <span className="text-info">{PROGRAM.campus}</span>
        </strong>
        <small>Folha de frequência mensal</small>
      </span>
    </span>
  );
}
