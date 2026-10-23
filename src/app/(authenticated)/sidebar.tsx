"use client";

import {
  ArrowLeftRight,
  Home,
  LogOut,
  Menu,
  Plus,
  Settings,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "../_actions/auth";

const navItems = [
  { href: "/", icon: Home, label: "Início" },
  { href: "/transactions", icon: ArrowLeftRight, label: "Movimentações" },
  { href: "/profile", icon: User, label: "Perfil" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
        aria-controls="authenticated-sidebar"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="fixed left-4 top-4 z-[60] rounded-lg bg-neutral-900 p-2 text-neutral-50 transition hover:bg-neutral-800 md:hidden"
      >
        {isOpen ? (
          <X className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Menu className="h-5 w-5" aria-hidden="true" />
        )}
      </button>

      {isOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-neutral-950/70 md:hidden"
        />
      )}

      <aside
        id="authenticated-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-60 shrink-0 flex-col justify-between border-r border-neutral-800 bg-neutral-950 px-4 pb-6 pt-20 transition-transform duration-200 ${
          isOpen ? "visible translate-x-0" : "invisible -translate-x-full"
        } md:sticky md:top-0 md:h-dvh md:self-start md:visible md:translate-x-0 md:py-6`}
      >
        <div>
          <div className="mb-8 px-2">
            <span className="text-lg font-bold leading-tight text-neutral-50">
              Sobrou Quanto?
            </span>
          </div>

          <button
            type="button"
            className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-bold text-neutral-950 transition hover:bg-emerald-400 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Lançar
          </button>

          <nav className="space-y-1">
            {navItems.map(({ href, icon: Icon, label }) => {
              const active = pathname === href;

              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                    active
                      ? "bg-neutral-900 text-neutral-50"
                      : "text-neutral-500 hover:text-neutral-300"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${active ? "text-emerald-400" : ""}`}
                    strokeWidth={active ? 2.5 : 2}
                  />
                  <span className="text-sm font-medium">{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="space-y-1">
          <button
            type="button"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-neutral-500 transition-colors hover:text-neutral-300"
          >
            <Settings className="h-4 w-4" />
            <span className="text-sm font-medium">Configurações</span>
          </button>
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-neutral-500 transition-colors hover:text-neutral-300"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm font-medium">Sair</span>
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
