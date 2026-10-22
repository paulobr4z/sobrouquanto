"use client";

import { Home, LogOut, Plus, Settings, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "../_actions/auth";

const navItems = [
  { href: "/", icon: Home, label: "Início" },
  { href: "/profile", icon: User, label: "Perfil" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col justify-between border-r border-neutral-800 px-4 py-6">
      <div>
        <div className="mb-8 px-2">
          <span className="text-lg font-bold leading-tight text-neutral-50">
            Finanças Pessoais
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
  );
}
