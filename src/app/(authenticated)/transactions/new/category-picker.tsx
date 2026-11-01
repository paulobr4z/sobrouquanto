"use client";

import { Search, Tag, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DynamicIcon } from "@/components/DynamicIcon";
import { type Category, categories } from "@/data/categories";

type CategoryPickerProps = {
  selectedCategory: Category | null;
  isOpen: boolean;
  hasError: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSelect: (category: Category) => void;
};

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

export function CategoryPicker({
  selectedCategory,
  isOpen,
  hasError,
  onOpenChange,
  onSelect,
}: CategoryPickerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
      searchInputRef.current?.focus();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const normalizedQuery = normalizeSearch(searchQuery.trim());
  const filteredCategories = categories.filter((category) =>
    normalizeSearch(category.name).includes(normalizedQuery),
  );

  return (
    <>
      <input
        type="hidden"
        name="category"
        value={selectedCategory?.name ?? ""}
      />
      <button
        id="transaction-category"
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-invalid={hasError}
        aria-describedby={hasError ? "transaction-category-error" : undefined}
        onClick={() => {
          setSearchQuery("");
          onOpenChange(true);
        }}
        className={`flex h-12 w-full items-center gap-3 rounded-xl border bg-neutral-900 px-4 text-left text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-emerald-500 ${
          hasError
            ? "border-rose-500/60 text-neutral-100"
            : "border-neutral-800 text-neutral-100 hover:border-neutral-700"
        }`}
      >
        {selectedCategory ? (
          <DynamicIcon
            name={selectedCategory.icon}
            className="h-4 w-4 shrink-0 text-neutral-500"
          />
        ) : (
          <Tag
            aria-hidden="true"
            className="h-4 w-4 shrink-0 text-neutral-500"
          />
        )}
        <span
          className={
            selectedCategory ? "truncate" : "truncate text-neutral-400"
          }
        >
          {selectedCategory?.name ?? "Selecione uma categoria"}
        </span>
      </button>
      {hasError && (
        <p
          id="transaction-category-error"
          role="alert"
          className="mt-2 text-xs text-rose-400"
        >
          Selecione uma categoria para continuar.
        </p>
      )}

      <dialog
        ref={dialogRef}
        aria-labelledby="category-dialog-title"
        onCancel={() => onOpenChange(false)}
        onClose={() => onOpenChange(false)}
        className="m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-2xl overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 p-0 text-neutral-100 shadow-2xl backdrop:bg-black/80"
      >
        <div className="relative flex max-h-[85dvh] flex-col p-5 sm:p-8">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Fechar seleção de categoria"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-800 hover:text-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 sm:right-6 sm:top-6"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
          <h2
            id="category-dialog-title"
            className="mb-6 pr-10 text-center text-xl font-semibold text-neutral-50 sm:mb-8 sm:text-2xl"
          >
            Qual categoria?
          </h2>

          <div className="relative mb-5 shrink-0 sm:mb-7">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500"
            />
            <input
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Buscar categoria"
              aria-label="Buscar categoria"
              className="h-14 w-full rounded-2xl border border-neutral-800 bg-neutral-900 px-12 text-base text-neutral-100 outline-none transition placeholder:text-neutral-600 focus:border-neutral-700 focus:ring-2 focus:ring-emerald-500/20 sm:h-16 sm:text-lg"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  searchInputRef.current?.focus();
                }}
                aria-label="Limpar busca"
                className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-neutral-500 transition hover:text-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            )}
          </div>

          <ul className="min-h-0 divide-y divide-neutral-800 overflow-y-auto overscroll-contain">
            {filteredCategories.map((category) => (
              <li key={category.name}>
                <button
                  type="button"
                  onClick={() => onSelect(category)}
                  className="flex min-h-16 w-full items-center gap-4 py-4 text-left text-base text-neutral-200 transition hover:text-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500 sm:min-h-[4.5rem] sm:text-lg"
                >
                  <DynamicIcon
                    name={category.icon}
                    className="h-6 w-6 shrink-0 text-neutral-400"
                  />
                  <span>{category.name}</span>
                </button>
              </li>
            ))}
            {filteredCategories.length === 0 && (
              <li className="px-2 py-8 text-center text-sm text-neutral-500">
                Nenhuma categoria encontrada.
              </li>
            )}
          </ul>
        </div>
      </dialog>
    </>
  );
}
