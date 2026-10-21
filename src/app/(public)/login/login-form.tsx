"use client";

import { Eye, EyeOff, Loader2, LockKeyhole, Mail, Wallet } from "lucide-react";
import { useActionState, useState } from "react";
import { signIn } from "../../_actions/auth";
import { AuthInput } from "../../components/auth-input";

export function LoginForm() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [notice, setNotice] = useState("");
  const [state, formAction, isPending] = useActionState(signIn, {});

  return (
    <div className="flex w-full max-w-xl flex-1 flex-col">
      <header>
        <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl border border-neutral-800 bg-[#171717]">
          <Wallet
            aria-hidden="true"
            className="h-5 w-5 text-emerald-400"
            strokeWidth={2.2}
          />
        </div>
        <h1 className="text-[28px] font-extrabold leading-tight tracking-[-0.04em] text-neutral-50">
          Bem-vindo de volta
        </h1>
        <p className="mt-1.5 text-sm text-neutral-400">
          Entre para acompanhar suas finanças.
        </p>
      </header>

      <form className="mt-9 flex flex-1 flex-col" action={formAction}>
        <div className="space-y-5">
          <AuthInput
            id="email"
            label="E-mail"
            leadingIcon={Mail}
            type="email"
            placeholder="voce@email.com"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            required
          />
          <AuthInput
            id="password"
            label="Senha"
            leadingIcon={LockKeyhole}
            type={passwordVisible ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="current-password"
            required
            trailingAction={
              <button
                type="button"
                className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:text-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
                onClick={() => setPasswordVisible((visible) => !visible)}
                aria-label={passwordVisible ? "Ocultar senha" : "Mostrar senha"}
                aria-pressed={passwordVisible}
              >
                {passwordVisible ? (
                  <EyeOff aria-hidden="true" className="h-[17px] w-[17px]" />
                ) : (
                  <Eye aria-hidden="true" className="h-[17px] w-[17px]" />
                )}
              </button>
            }
          />
        </div>

        <div className="mt-3 flex justify-end">
          <button
            type="button"
            className="text-xs font-semibold text-emerald-400 transition-colors hover:text-emerald-300 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
            onClick={() =>
              setNotice(
                "A recuperação de senha será habilitada com o Supabase.",
              )
            }
          >
            Esqueci minha senha
          </button>
        </div>

        <div className="mt-auto pt-10">
          <button
            type="submit"
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4 text-sm font-bold text-neutral-950 transition-transform active:scale-[0.98] disabled:active:scale-100 disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
          >
            {isPending && (
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            )}
            {isPending ? "Entrando..." : "Entrar"}
          </button>
          <p className="mt-4 text-center text-sm text-neutral-400">
            Ainda não tem conta?{" "}
            <button
              type="button"
              className="font-bold text-emerald-400 transition-colors hover:text-emerald-300 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
              onClick={() =>
                setNotice("A criação de conta será habilitada com o Supabase.")
              }
            >
              Criar conta
            </button>
          </p>
          {state.error && (
            <p className="mt-4 text-center text-xs text-red-400" role="alert">
              {state.error}
            </p>
          )}
          {notice && (
            <output
              className="mt-4 text-center text-xs text-neutral-500"
              aria-live="polite"
            >
              {notice}
            </output>
          )}
        </div>
      </form>
    </div>
  );
}
