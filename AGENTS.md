<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Diretrizes do projeto

Leia estas instruções antes de criar ou modificar código. O projeto é uma aplicação web de controle financeiro pessoal feita com Next.js, React, TypeScript, Tailwind CSS e Supabase. A interface deve ser mobile-first e funcionar bem em telas pequenas, médias e grandes.

## 1. Regras do Next.js

- Consulte a documentação instalada em `node_modules/next/dist/docs/` antes de implementar ou alterar funcionalidades do Next.js. Use a documentação da versão instalada no projeto e siga seus avisos de depreciação.
- O projeto usa o App Router em `src/app/`. Arquivos especiais como `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx` e `route.ts` devem respeitar as convenções do Next.js.
- Use `page.tsx` e `layout.tsx` para compor as páginas e layouts. Eles não precisam ser apenas reexportações: podem buscar dados e compor a interface no servidor quando isso for adequado.
- Grupos de rota entre parênteses, como `(public)` e `(authenticated)`, organizam páginas sem criar segmentos na URL.
- Preserve a organização existente. Não mova nem reorganize arquivos sem necessidade para a tarefa.

## 2. Organização do código

Use a estrutura atual como referência:

```text
src/
├── app/                    # Rotas, layouts e arquivos especiais do App Router
│   ├── (public)/           # Páginas públicas
│   ├── (authenticated)/    # Páginas que exigem sessão
│   └── _actions/           # Server Actions
├── components/             # Componentes compartilhados
├── lib/                    # Integrações e utilitários
│   └── supabase/           # Clientes e helpers do Supabase
└── proxy.ts                # Proxy do Next.js
```

Essa estrutura é uma referência, não uma lista de diretórios obrigatórios. Para uma funcionalidade maior, crie `src/features/<feature>/` com componentes, hooks, tipos ou serviços específicos somente quando isso melhorar a coesão. Não crie pastas vazias nem camadas que apenas renomeiem ou reexportem código sem necessidade.

| Camada | Responsabilidade |
|---|---|
| `app/` | Rotas, layouts e composição de páginas |
| `app/_actions/` | Server Actions para operações iniciadas por formulários ou componentes |
| `components/` | Componentes visuais compartilhados entre funcionalidades |
| `features/<feature>/` | Componentes e lógica específicos de uma funcionalidade, quando necessário |
| `lib/` | Integrações externas, acesso a dados e utilitários reutilizáveis |

Comece com componentes específicos da funcionalidade. Promova-os para `components/` somente quando houver reutilização real. Evite abstrações genéricas com muitas props opcionais ou flags para casos hipotéticos.

## 3. Server Components, Client Components e dados

- Componentes são Server Components por padrão. Mantenha-os assim sempre que não precisarem de estado, efeitos, handlers de eventos ou APIs do navegador.
- Adicione `"use client"` somente no menor componente que realmente precise de interatividade ou de APIs do navegador; não transforme uma página inteira em Client Component por conveniência.
- Mantenha segredos, credenciais e operações de servidor fora do código enviado ao navegador. Reutilize os helpers existentes em `src/lib/supabase/` e mantenha módulos exclusivamente de servidor protegidos com `server-only` quando apropriado.
- Valide os dados recebidos por Server Actions e Route Handlers no servidor. Não confie em validação feita apenas na interface.
- O `src/proxy.ts` pode atualizar cookies ou fazer verificações otimistas, mas não substitui a autenticação e a autorização nos layouts, Server Actions e operações que acessam dados.
- Não exponha chaves privilegiadas do Supabase no cliente. Use somente as variáveis e os clientes apropriados para cada contexto.

## 4. Interface web mobile-first

- Projete primeiro para telas estreitas e amplie progressivamente usando os breakpoints responsivos já adotados no projeto.
- Evite larguras, alturas e posicionamentos fixos que causem rolagem horizontal ou conteúdo cortado. Prefira layouts fluidos, limites de largura para conteúdo e áreas roláveis quando fizerem sentido.
- Verifique que navegação, formulários, cartões, tabelas e gráficos continuam utilizáveis em telas pequenas; adapte a apresentação de dados densos para dispositivos móveis em vez de apenas reduzir tudo.
- Em telas maiores, aproveite o espaço adicional com hierarquia e limites de leitura adequados; não estique conteúdo sem necessidade.
- Use elementos HTML semânticos, rótulos associados aos campos, estados de foco visíveis e controles acessíveis por teclado. Ícones decorativos não devem substituir nomes acessíveis.

## 5. Estilos

- Siga o padrão existente: Tailwind CSS 4 está configurado e os estilos globais ficam em `src/app/globals.css`.
- Prefira utilitários responsivos do Tailwind para estilos locais. Use CSS global apenas para regras realmente globais e CSS Modules se um componente precisar de estilos locais que não se ajustem bem ao padrão existente.
- Evite duplicar tokens e estilos globais; reutilize as variáveis e convenções já definidas antes de adicionar novas.

## 6. Nomenclatura e componentes

- Use inglês em nomes de arquivos, rotas, variáveis, funções, componentes e tipos. Mantenha os textos exibidos ao usuário em português.
- Componentes e tipos: `PascalCase`; funções, variáveis e hooks: `camelCase`; hooks começam com `use`.
- Arquivos especiais do Next.js usam os exports exigidos pelo framework. Para componentes comuns, prefira exports nomeados, seguindo o padrão existente.
- Tipifique props e dados de domínio. Evite tipos imprecisos e conversões de tipo que escondam erros.
- Use o alias `@/` para imports a partir de `src/`, conforme configurado em `tsconfig.json`.

## 7. Divisão e refatoração

Divida um arquivo ou componente quando houver responsabilidades distintas, lógica de dados misturada a uma interface extensa ou quando a extração melhorar claramente a leitura e o reuso. Use o tamanho do arquivo apenas como alerta, não como limite automático.

Ao refatorar:

1. Faça mudanças localizadas e preserve o comportamento existente.
2. Extraia tipos, constantes, hooks e componentes apenas quando houver um limite de responsabilidade claro.
3. Não altere textos, regras de negócio ou apresentação fora do escopo pedido.
4. Rode as verificações relevantes após a mudança.

## 8. Verificação

- Use `pnpm lint` para verificar formatação e regras do Biome.
- Use `pnpm build` para validar a compilação de produção quando a mudança afetar código ou configuração do Next.js.
- Não declare testes automatizados existentes sem antes confirmar que há um comando ou conjunto de testes configurado para eles.
