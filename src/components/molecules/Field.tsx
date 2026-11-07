import { useId, type ReactElement, type ReactNode, cloneElement } from "react";
import { Label } from "../atoms/Label";

/** Rótulo + campo + dica/erro. O `child` recebe o id para ligar o <label> ao <input>. */
export function Field({
  label,
  hint,
  error,
  aside,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  aside?: ReactNode;
  children: ReactElement<{ id?: string; invalid?: boolean }>;
}) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        {aside}
      </div>
      {cloneElement(children, { id, invalid: Boolean(error) || children.props.invalid })}
      {error ? (
        <p role="alert" className="text-body-sm text-error">{error}</p>
      ) : (
        hint && <p className="text-body-sm text-on-surface-variant">{hint}</p>
      )}
    </div>
  );
}
