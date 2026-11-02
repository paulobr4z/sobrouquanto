"use client";

import { Loader2 } from "lucide-react";
import { useActionState } from "react";
import { type ProfileNameState, saveProfileName } from "@/app/_actions/profile";

const initialState: ProfileNameState = {
  status: "idle",
  message: "",
};

export function ProfileNameForm({ displayName }: { displayName: string }) {
  const [state, formAction, isPending] = useActionState(
    saveProfileName,
    initialState,
  );

  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
      <h2 className="text-base font-semibold text-neutral-100">Seu nome</h2>
      <p className="mt-1 text-sm text-neutral-400">
        Esse nome será usado para identificar seu perfil.
      </p>
      <form action={formAction} className="mt-4">
        <label
          htmlFor="display-name"
          className="mb-2 block text-sm font-medium text-neutral-300"
        >
          Nome
        </label>
        <input
          id="display-name"
          name="displayName"
          type="text"
          required
          maxLength={100}
          defaultValue={displayName}
          autoComplete="name"
          className="h-12 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 text-sm text-neutral-100 outline-none transition placeholder:text-neutral-600 focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/10"
        />
        <button
          type="submit"
          disabled={isPending}
          className="mt-4 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending && (
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
          )}
          {isPending ? "Salvando..." : "Salvar nome"}
        </button>
        {state.message && (
          <p
            className={`mt-3 text-sm ${
              state.status === "error" ? "text-rose-300" : "text-emerald-300"
            }`}
            role={state.status === "error" ? "alert" : "status"}
          >
            {state.message}
          </p>
        )}
      </form>
    </section>
  );
}
