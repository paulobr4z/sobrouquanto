import type { LucideIcon } from "lucide-react";
import type { InputHTMLAttributes, ReactNode } from "react";

type AuthInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  leadingIcon: LucideIcon;
  trailingAction?: ReactNode;
  type: "email" | "password" | "text";
};

export function AuthInput({
  id,
  label,
  leadingIcon: LeadingIcon,
  trailingAction,
  type,
  ...inputProps
}: AuthInputProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2.5 block text-xs font-medium text-neutral-400"
      >
        {label}
      </label>
      <div className="flex h-[52px] items-center rounded-2xl border border-neutral-800 bg-[#181818] px-4 transition-colors focus-within:border-emerald-500/60">
        <LeadingIcon
          aria-hidden="true"
          className="mr-3 h-[17px] w-[17px] shrink-0 text-neutral-500"
          strokeWidth={2}
        />
        <input
          {...inputProps}
          id={id}
          name={inputProps.name ?? id}
          type={type}
          className="h-full min-w-0 flex-1 bg-transparent text-sm text-neutral-100 outline-none placeholder:text-neutral-500"
        />
        {trailingAction}
      </div>
    </div>
  );
}
