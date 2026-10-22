import type { LucideIcon } from "lucide-react";

type SummaryMetricCardProps = {
  title: string;
  value: string;
  icon: LucideIcon;
  variant: "income" | "expense";
};

const variantStyles = {
  income: {
    iconContainer: "bg-emerald-500/15",
    icon: "text-emerald-400",
  },
  expense: {
    iconContainer: "bg-neutral-800",
    icon: "text-neutral-300",
  },
} satisfies Record<
  SummaryMetricCardProps["variant"],
  {
    iconContainer: string;
    icon: string;
  }
>;

export function SummaryMetricCard({
  title,
  value,
  icon: Icon,
  variant,
}: SummaryMetricCardProps) {
  const styles = variantStyles[variant];

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 sm:p-6">
      <div
        className={`mb-3 flex h-9 w-9 items-center justify-center rounded-full ${styles.iconContainer}`}
      >
        <Icon className={`h-4 w-4 ${styles.icon}`} />
      </div>
      <p className="text-sm font-medium text-neutral-400">{title}</p>
      <p className="mt-0.5 text-xl md:text-3xl font-bold text-neutral-50">
        {value}
      </p>
    </div>
  );
}
