import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export function TextField({ label, hint, error, id, className = "", ...rest }: TextFieldProps) {
  const inputId = id ?? `field-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className={className}>
      <label htmlFor={inputId} className="field-label">
        {label}
      </label>
      <input id={inputId} className="field-input" {...rest} />
      {hint && !error && <p className="mt-1 text-xs text-muted-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
  error?: string;
  counter?: { current: number; max: number };
}

export function TextAreaField({
  label,
  hint,
  error,
  counter,
  id,
  className = "",
  ...rest
}: TextAreaProps) {
  const inputId = id ?? `field-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        <label htmlFor={inputId} className="field-label">
          {label}
        </label>
        {counter && (
          <span className="text-[11px] text-muted-500">
            {counter.current} / {counter.max}
          </span>
        )}
      </div>
      <textarea id={inputId} className="field-input min-h-[96px] resize-none" {...rest} />
      {hint && !error && <p className="mt-1 text-xs text-muted-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
