import { LogOut } from "lucide-react";
import { signOut } from "../../_actions/auth";

export default function ProfilePage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight text-neutral-50 sm:text-3xl">
        Perfil
      </h1>

      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
        <h2 className="text-base font-semibold text-neutral-100">Sessão</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Encerre sua sessão neste dispositivo.
        </p>
        <form action={signOut} className="mt-4">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl border border-neutral-700 px-4 py-2.5 text-sm font-medium text-neutral-300 transition hover:border-rose-400/50 hover:text-rose-300"
          >
            <LogOut aria-hidden="true" className="h-4 w-4" />
            Sair
          </button>
        </form>
      </section>
    </div>
  );
}
