# TEAR — Prontuário Inteligente para Clínicas de TEA

> Memória do projeto. Diretrizes definidas pelo dono do projeto. Reler sempre.

## Sobre

TEAR = **Tecnologia, Empatia, Acompanhamento e Registro**. Sistema de prontuário
inteligente para clínicas especializadas em TEA. Projeto **novo e independente** —
**NÃO** tem relação com Sponte nem ETP.

Slogan oficial: "Prontuário Inteligente para Clínicas de TEA".

## Princípios inegociáveis

1. **Sempre refatorável** — manter o código continuamente em estado refatorável:
   limpo, modular, baixo acoplamento, sem duplicação, fácil de evoluir sem grandes
   reescritas.
2. **Multi-tenant** — arquitetura multi-inquilino desde a base. Isolamento de dados
   por `tenant_id` + Row Level Security (RLS) no Postgres/Supabase. Segregação total
   entre clínicas.

## Diretrizes de UI/UX

3. **Melhores componentes** — sempre usar os componentes mais adequados e bem
   construídos (base Radix/shadcn, acessíveis), sem reinventar o que já existe com
   qualidade.
4. **Formato moderno** — visual atual, responsivo, espaçamento consistente,
   microinterações suaves (tailwindcss-animate), boa hierarquia visual.
5. **Cores da identidade visual** — seguir sempre a paleta TEAR (tokens no tema).
6. **Comunicação clean, intuitiva e tecnológica** — NUNCA infantilizada.

## Identidade visual (Manual da Marca TEAR)

### Paleta oficial
| Cor | Hex | Significado |
|-----|-----|-------------|
| Azul Escuro | `#001F6B` | tecnologia, segurança (predominante) |
| Azul Claro | `#1E88FF` | — |
| Amarelo | `#FFC400` | diversidade / desenvolvimento |
| Vermelho | `#FF2D2D` | diversidade / desenvolvimento |
| Ciano | `#45C7FF` | — |

### Tipografia
Montserrat, Poppins, Nunito Sans, Outfit. Deve transmitir clareza, modernidade e
acessibilidade.

### Elementos visuais
- Formas **arredondadas** e suaves (acolhimento/empatia) → `border-radius` generoso.
- Barras coloridas = diversidade e desenvolvimento.
- Ponto central do "A" = pessoa no centro do cuidado.

### Valores da marca
Inclusão · Tecnologia · Humanização · Organização · Ética · Inovação

## Funcionalidades registradas

7. **Configurações → Layout** — área no front para o usuário:
   - Trocar a **logo** (upload → Supabase Storage).
   - Trocar as **cores** do sistema (editar tokens da paleta).
   - Configurações **por tenant** (cada clínica com sua identidade); paleta TEAR
     como padrão. Aplicar via CSS variables (troca em runtime, sem rebuild).
   - Opção de **reset** para a identidade padrão TEAR.

## Stack

### Frontend
- TypeScript ~5.5
- React 18 + React DOM
- Vite 6 (build/dev server)
- React Router DOM 6
- TanStack React Query 5
- React Hook Form + Zod + @hookform/resolvers

### UI / Estilo
- Tailwind CSS 3 + tailwindcss-animate + PostCSS/Autoprefixer
- Radix UI (base do shadcn/ui — `components.json`)
- lucide-react, class-variance-authority, clsx, tailwind-merge
- recharts, sonner, cmdk, vaul, embla-carousel, @dnd-kit
- react-day-picker + date-fns

### Backend / Dados
- Supabase (@supabase/supabase-js) — Postgres + Auth; pasta `supabase/` com migrações
- Deploy na Vercel (`vercel.json`, `.vercel/`)

### Scripts auxiliares
- Node.js `.cjs` (sync, testes). **Sem** integração Sponte/ETP.

## Infra / Conexões

- **Supabase:** projeto `tear`, ref `kfjsyeopooxipnnxcdkz`
  (`https://kfjsyeopooxipnnxcdkz.supabase.co`), org `lhrercddcglaxvykbgen`,
  região `sa-east-1`, Postgres 17.
- **Vercel:** projeto `tear` (`prj_cAesVXf9FRrq101iZ6lFjCYMUvii`), time
  `dapvconta's projects`.
- **GitHub:** usuário `DAPVConta`.

## Segredos / .env

- O `.env` fica **somente local** (`C:\sistemas\TEAR\.env`). NUNCA commitar.
- `.gitignore` já ignora `.env` (versionar só `.env.example` sem valores).
- Variáveis: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY` (apenas servidor/scripts), `VITE_APP_NAME`.
- Para deploy: cadastrar as variáveis em Vercel → Environment Variables.
- `SUPABASE_SERVICE_ROLE_KEY` é crítica — jamais no front nem no GitHub.
