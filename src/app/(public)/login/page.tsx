import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Entrar | Sobrou Quanto?",
  description: "Entre na sua conta para acompanhar suas finanças pessoais.",
};

export default function LoginPage() {
  return (
    <main className="m-2 flex min-h-[calc(100dvh-1rem)] flex-col items-center bg-[#080808] px-6 pb-7 pt-[clamp(2.5rem,7vh,3.5rem)] sm:px-8">
      <LoginForm />
    </main>
  );
}
