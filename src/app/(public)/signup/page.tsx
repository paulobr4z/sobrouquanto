import type { Metadata } from "next";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Criar conta | Sobrou Quanto?",
  description: "Crie sua conta para organizar suas finanças pessoais.",
};

export default function SignupPage() {
  return (
    <main className="m-2 flex min-h-[calc(100dvh-1rem)] flex-col items-center bg-[#080808] px-6 pb-7 pt-[clamp(2.5rem,7vh,3.5rem)] sm:px-8">
      <SignupForm />
    </main>
  );
}
