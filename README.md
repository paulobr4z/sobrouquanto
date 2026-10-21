# Sobrou Quanto?

Aplicação de controle de finanças pessoais construída com Next.js e Supabase Auth.

## Configuração

Defina no `.env` as variáveis `EXPO_PUBLIC_SUPABASE_URL` e
`EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, usando a URL do projeto e a chave
publishable do Supabase. Não use a chave `service_role` no frontend ou neste
fluxo de autenticação.

Instale as dependências e inicie o servidor:

```bash
pnpm install
pnpm dev
```

## Rotas e autenticação

- `src/app/(public)/`: páginas públicas, como `/login`; usuários autenticados
  são enviados para `/`.
- `src/app/(authenticated)/`: páginas que exigem sessão; usuários sem sessão
  são enviados para `/login`.
- `src/proxy.ts`: atualiza os cookies da sessão Supabase entre requisições.

As pastas entre parênteses organizam as páginas sem alterar as URLs. A proteção
de páginas é validada no servidor; o Proxy mantém os tokens atualizados, mas não
substitui essa validação.
