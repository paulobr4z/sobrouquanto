"use client";

import { Eye, EyeOff, Loader2, LockKeyhole, Mail } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { signUp } from "../../_actions/auth";
import { AuthInput } from "../../components/auth-input";

export function SignupForm() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [state, formAction, isPending] = useActionState(signUp, {});

  return (
    <div className="flex w-full max-w-xl flex-1 flex-col">
      <header>
        <h1 className="text-[28px] font-extrabold leading-tight tracking-[-0.04em] text-neutral-50">
          Crie sua conta
        </h1>
        <p className="mt-1.5 text-sm text-neutral-400">
          Comece a organizar suas finanças pessoais.
        </p>
      </header>

      {state.success ? (
        <div className="mt-9">
          <output className="block text-sm leading-6 text-neutral-300">
            Enviamos um e-mail de confirmação para você. Abra a mensagem e
            confirme seu endereço para ativar sua conta. Você só poderá entrar
            na plataforma depois de confirmar o e-mail. Se não encontrar a
            mensagem, confira também a caixa de spam.
          </output>
          <Link
            href="/login"
            className="mt-8 flex w-full items-center justify-center rounded-2xl bg-emerald-500 py-4 text-sm font-bold text-neutral-950 transition-transform active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
          >
            Ir para entrar
          </Link>
        </div>
      ) : (
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
              placeholder="Mínimo de 8 caracteres"
              autoComplete="new-password"
              minLength={8}
              required
              trailingAction={
                <button
                  type="button"
                  className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:text-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
                  onClick={() => setPasswordVisible((visible) => !visible)}
                  aria-label={
                    passwordVisible ? "Ocultar senhas" : "Mostrar senhas"
                  }
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
            <AuthInput
              id="passwordConfirmation"
              label="Confirme sua senha"
              leadingIcon={LockKeyhole}
              type={passwordVisible ? "text" : "password"}
              placeholder="Digite sua senha novamente"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>

          <div className="pt-8">
            <button
              type="submit"
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4 text-sm font-bold text-neutral-950 transition-transform active:scale-[0.98] disabled:active:scale-100 disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
            >
              {isPending && (
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              )}
              {isPending ? "Criando conta..." : "Criar conta"}
            </button>
            <p className="mt-4 text-center text-sm text-neutral-400">
              Já tem uma conta?{" "}
              <Link
                href="/login"
                className="font-bold text-emerald-400 transition-colors hover:text-emerald-300 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
              >
                Entrar
              </Link>
            </p>
            {state.error && (
              <p className="mt-4 text-center text-xs text-red-400" role="alert">
                {state.error}
              </p>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
