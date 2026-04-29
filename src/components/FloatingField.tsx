"use client";

import type { ReactNode, SelectHTMLAttributes } from "react";

const FIELD_BASE =
  "peer w-full rounded-md border border-slate-300 px-3 pt-5 pb-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500";

function FloatingLabel({ label, isFilled }: { label: string; isFilled: boolean }) {
  return (
    <label
      className={[
        "pointer-events-none absolute left-3 transition-all",
        isFilled
          ? "top-1 text-[10px] text-slate-500"
          : "top-1 text-[10px] text-slate-500 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400 peer-focus:top-1 peer-focus:text-[10px] peer-focus:text-slate-500",
      ].join(" ")}
    >
      {label}
    </label>
  );
}

export function FloatingInput({
  label,
  value,
  onChange,
  onBlur,
  onEnter,
  disabled,
  readOnly,
  placeholder,
  type = "text",
  min,
  max,
}: {
  label: string;
  value: string | number;
  onChange?: (v: string) => void;
  onBlur?: (v: string) => void;
  onEnter?: (v: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  type?: "text" | "number";
  min?: number;
  max?: number;
}) {
  const hasValue = value !== "" && value !== undefined && value !== null;
  const hasRealPlaceholder = !!placeholder && placeholder.trim() !== "";
  const isFilled = hasValue || hasRealPlaceholder;
  return (
    <div className="relative">
      <input
        type={type}
        min={min}
        max={max}
        className={[FIELD_BASE, disabled || readOnly ? "bg-slate-50" : "bg-white"].join(" ")}
        value={value}
        disabled={disabled}
        readOnly={readOnly}
        placeholder={placeholder ?? " "}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        onBlur={onBlur ? (e) => onBlur(e.target.value) : undefined}
        onKeyDown={
          onEnter
            ? (e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onEnter((e.target as HTMLInputElement).value);
                }
              }
            : undefined
        }
      />
      <FloatingLabel label={label} isFilled={isFilled} />
    </div>
  );
}

export function FloatingSelect({
  label,
  value,
  onChange,
  disabled,
  children,
  ...rest
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  disabled?: boolean;
  children: ReactNode;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "value" | "onChange" | "disabled">) {
  return (
    <div className="relative">
      <select
        {...rest}
        className={[FIELD_BASE, "appearance-none bg-white pr-8", disabled ? "bg-slate-50" : ""].join(" ")}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        {children}
      </select>
      <FloatingLabel label={label} isFilled />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">▾</span>
    </div>
  );
}
