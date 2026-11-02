"use client";

import { ArrowLeftRight, Home, User, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const navItems = [
  { href: "/", icon: Home, label: "Início" },
  { href: "/transactions", icon: ArrowLeftRight, label: "Movimentações" },
  { href: "/budget", icon: Wallet, label: "Orçamento" },
  { href: "/profile", icon: User, label: "Perfil" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-neutral-800 bg-neutral-950 px-4 pb-6 pt-20 md:sticky md:top-0 md:flex md:h-dvh md:self-start">
      <nav aria-label="Navegação principal" className="w-full space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active =
            pathname === href ||
            (href !== "/" && pathname.startsWith(`${href}/`));

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
                aria-hidden="true"
                className={`h-4 w-4 ${active ? "text-emerald-400" : ""}`}
                strokeWidth={active ? 2.5 : 2}
              />
              <span className="text-sm font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
