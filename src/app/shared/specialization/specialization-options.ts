import { SelectOption } from "../ui/select-field/select-field";
import { Specialization } from "./specialization.model";

export function toSelectOptions(specializations: Specialization[]): SelectOption[] {
    return specializations.map((spec) => ({ value: String(spec.id), label: spec.name}));
}