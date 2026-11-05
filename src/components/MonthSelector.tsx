"use client";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const MONTHS_FULL = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const MONTHS_SHORT = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

const currentDate = new Date();

export const INITIAL_PERIOD: Period = {
  month: currentDate.getMonth(),
  year: currentDate.getFullYear(),
};

export type Period = {
  month: number;
  year: number;
};

type MonthSelectorProps = {
  period: Period;
  onChangePeriod: (period: Period) => void;
};

export function MonthSelector({ period, onChangePeriod }: MonthSelectorProps) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(period.year);
  const [draft, setDraft] = useState<Period>(period);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const openPicker = () => {
    setViewYear(period.year);
    setDraft(period);
    setOpen(true);
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const draftIsCurrent =
    draft.month === INITIAL_PERIOD.month && draft.year === INITIAL_PERIOD.year;
  const draftChanged =
    draft.month !== period.month || draft.year !== period.year;

  return (
    <>
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openPicker())}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-neutral-800 px-4 py-2 transition-colors hover:bg-neutral-800/60"
      >
        <span className="whitespace-nowrap text-sm font-medium text-neutral-100 sm:text-base">
          {MONTHS_FULL[period.month]} de {period.year}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 text-neutral-100 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="month-selector-title"
        onCancel={() => setOpen(false)}
        onClose={() => setOpen(false)}
        className="m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-sm overflow-y-auto rounded-2xl border border-neutral-800 bg-neutral-950 p-5 text-neutral-100 shadow-2xl backdrop:bg-black/80"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2
            id="month-selector-title"
            className="text-sm font-bold text-neutral-50"
          >
            Selecionar mês
          </h2>
          <button
            type="button"
            aria-label="Fechar seletor de período"
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-800 text-neutral-500 transition-colors hover:text-neutral-300"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 flex items-center justify-center gap-6">
          <button
            type="button"
            aria-label="Ano anterior"
            onClick={() => setViewYear((year) => year - 1)}
            className="flex h-9 w-9 items-center justify-center text-neutral-500 transition-colors hover:text-neutral-300"
          >
            <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          </button>
          <span className="w-14 text-center text-base font-bold text-neutral-50 tabular-nums">
            {viewYear}
          </span>
          <button
            type="button"
            aria-label="Próximo ano"
            onClick={() => setViewYear((year) => year + 1)}
            className="flex h-9 w-9 items-center justify-center text-neutral-500 transition-colors hover:text-neutral-300"
          >
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-5 grid grid-cols-3 gap-1.5">
          {MONTHS_SHORT.map((monthName, monthIndex) => {
            const isDraft =
              draft.month === monthIndex && draft.year === viewYear;
            const isCurrent =
              INITIAL_PERIOD.month === monthIndex &&
              INITIAL_PERIOD.year === viewYear;

            return (
              <button
                key={monthName}
                type="button"
                aria-pressed={isDraft}
                onClick={() => setDraft({ month: monthIndex, year: viewYear })}
                className={`rounded-xl border py-3 text-sm font-semibold transition-colors ${
                  isDraft
                    ? "border-emerald-400 text-emerald-400"
                    : isCurrent
                      ? "border-neutral-700 text-neutral-100 hover:bg-neutral-900"
                      : "border-transparent text-neutral-400 hover:bg-neutral-900"
                }`}
              >
                {monthName}
              </button>
            );
          })}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setViewYear(INITIAL_PERIOD.year);
              setDraft(INITIAL_PERIOD);
            }}
            disabled={draftIsCurrent}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-neutral-800 px-3.5 py-2.5 text-xs font-semibold text-neutral-300 transition-colors hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
            Mês atual
          </button>

          <button
            type="button"
            onClick={() => {
              onChangePeriod(draft);
              setOpen(false);
            }}
            disabled={!draftChanged}
            className="flex-1 rounded-xl bg-emerald-500 px-3.5 py-2.5 text-xs font-bold text-neutral-950 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-emerald-500"
          >
            Aplicar período
          </button>
        </div>
      </dialog>
    </>
  );
}
