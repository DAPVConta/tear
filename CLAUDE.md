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
7. **Componentes os melhores e mais modernos** — sempre o estado da arte
   (Radix/shadcn + animações), nada genérico ou datado.
8. **Layout IMPONENTE** — prioridade máxima. O layout deve impressionar:
   presença visual forte, premium, profissional. Sidebar marcante, hero/dashboard
   com profundidade (gradientes sutis da paleta, sombras suaves, glassmorphism com
   parcimônia), tipografia expressiva, generoso uso de espaço, transições fluidas.
   Causar impacto à primeira vista — sem perder a sobriedade clínica.
9. **RÉGUA DE UI: A MAIS ELEVADA POSSÍVEL** — padrão de produto top de mercado
   (nível Linear/Vercel/Stripe). Nunca aceitar "bom o suficiente": cada tela deve
   ter polimento de detalhe (estados hover/focus/loading/empty/error caprichados,
   skeletons, alinhamento pixel-perfect, consistência total). Em caso de dúvida,
   escolher sempre a opção visual mais refinada.

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

## Integrações automáticas (investigar sempre)

A cada campo/componente novo, **investigar se cabe integração com algum serviço**
para preencher/validar dados automaticamente, em vez de digitação manual. Exemplos:
- **CEP → endereço** (ViaCEP/BrasilAPI): autopreencher rua, bairro, cidade, UF.
- **CID-10**: busca/autocomplete por código ou descrição (base CID).
- **CNPJ → dados da empresa** (BrasilAPI/ReceitaWS): razão social, etc.
- **CPF/telefone**: validação/formatação (já temos máscaras).
- Outras APIs públicas pertinentes ao contexto clínico.
Sempre avaliar custo/benefício, privacidade (dados de saúde) e disponibilidade da
API antes de implementar; quando houver dúvida de escopo, perguntar.

## Migração do sistema legado (Prontuário TEA → TEAR)

Sistema legado em `_legacy/` (NÃO versionar no app final; é referência). Origem:
tRPC + Express + Drizzle/MySQL + Manus OAuth SDK + wouter + React 19 + Tailwind v4
+ Stripe + AWS S3.

### Mapeamento de tecnologia (legado → TEAR)
| Camada | Legado | TEAR |
|--------|--------|------|
| Auth | Manus OAuth SDK | Supabase Auth |
| API | tRPC + Express | Supabase client + React Query |
| Banco | MySQL + Drizzle | Postgres + migrações Supabase |
| Multi-tenant | `clinicId` filtrado em query | RLS por `tenant_id` |
| Rotas | wouter | React Router DOM 6 |
| React | 19 | 18 |
| Tailwind | v4 | v3 |
| Vite | 7 | 6 |
| Storage | AWS S3 | Supabase Storage |
| Pagamento | Stripe | **Asaas (fase 2)** |

### Decisões de escopo
- **Billing (Asaas):** fase 2.
- **IA / voz / imagem / mapa (Manus _core):** fase 2.
- **Super Admin:** incluir no núcleo.
- **Fidelidade:** replicar todas as funcionalidades + melhorias de UX/UI quando agregarem.

### Modelo de dados (11 entidades)
users, clinics (tenant), clinic_members (papéis), professionals, patients,
authorizations (guias), therapeutic_plans (PTS) + therapeutic_goals,
daily_evolutions, monthly_evolutions, attendance_records, audit_logs.

### Regras de negócio ("blindagem") — preservar
Campos obrigatórios p/ fechamento; anti-duplicidade de atendimento; alerta de
vencimento de guia; tempo mínimo de sessão; bloqueio de edição após 24h;
validação CID × procedimento; checklist de faturamento dinâmico (sem hardcode);
papéis: platform_admin, clinic_admin, therapist, receptionist; particular vs
operadora; restrição editar/excluir só pelo criador.

### Plano de incrementos (um PR pequeno por peça)
1. [FEITO] Fundação: Vite6+React18+TS, Tailwind3+shadcn, tokens/fontes TEAR,
   Router, React Query, Supabase client, layout base + Landing.
2. [FEITO] Banco + Auth + Multi-tenant: migrações Supabase (enums, 12 tabelas
   c/ clinic_id), RLS por clínica (funções is_clinic_member/admin/platform_admin),
   RPC create_clinic, Supabase Auth (login/cadastro), onboarding, guards de rota,
   AuthProvider + ClinicProvider. Tipos em src/types/database.ts.
   - NOTA env: app exige VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY em runtime
     (local .env + Vercel Settings → Environment Variables); senão tela branca.
   - LIMITAÇÃO conhecida (refinar depois): profiles_select só expõe o próprio
     perfil; membros da mesma clínica ainda não veem nome um do outro. Ajustar
     ao implementar gestão de membros.
   - INTEGRIDADE (refinar): RLS valida membership por clinic_id, não a coerência
     entre clinic_id e FKs (ex.: goal.clinic_id vs plan.clinic_id). Sem vazamento
     entre tenants; adicionar checks/triggers se necessário.
3. [FEITO] Pacientes (CRUD, máscaras CPF/telefone, validação Zod PT-BR,
   busca debounce + paginação server-side, arquivamento, RLS + clinic_id em
   todas as queries, busca sanitizada contra injeção PostgREST).
4. [FEITO] Profissionais (CRUD, especialidades, conselho UF/tipo, mesmo padrão
   de Pacientes; Field de formulário extraído para componente compartilhado).
5. [FEITO] Guias/Autorizações (CRUD, seletor de paciente, status efetivo
   derivado (ativa/vencida/esgotada/cancelada), alerta de vencimento, cancelar).
6. [FEITO] PTS + metas (CRUD com sub-entidade): plano + metas dinâmicas
   (useFieldArray), reconciliação (insert/update/delete) ao salvar, encerrar.
   - Limitação conhecida (refinar): sem transação no salvar — em falha
     parcial, plano e metas podem ficar dessincronizados. Mitigar com RPC
     `save_plan_with_goals` em incremento dedicado se ficar crítico.
7. [FEITO] Evolução diária (form estruturado em 5 seções, validação Zod
   completa, regras de blindagem: anti-duplicidade por sobreposição de
   horário, duração mínima de 30min, bloqueio automático após 24h,
   validação do responsável, assinatura). Operadora vs particular.
   - Limitações conhecidas (refinar):
     * Bloqueio 24h é client-side; uma trigger/RPC no Postgres daria
       garantia server-side.
     * UX do "adendo" (corrigir evolução bloqueada) ainda não implementada.
     * Validação CID×procedimento (legado): exige base de CID; defer.
     * Atualização automática de used_quantity da guia: defer (precisa
       trigger ou RPC).
8. Frequência/Presença (registro + justificativa).
9. Evolução mensal (motor de geração automática + aprovação + PDF).
10. Auditoria/Faturamento (checklist dinâmico + audit logs + dashboard).
11. Dashboard (métricas + gráficos).
12. Configurações → Layout (logo/cores por tenant) + ClinicSettings.
13. Super Admin (gestão de clínicas + métricas globais).
14. Fase 2: Asaas billing, IA/voz/mapa.

### Agentes por incremento
backend, frontend, ux, ui, code-review. Cada peça passa por review antes do PR.

## Segredos / .env

- O `.env` fica **somente local** (`C:\sistemas\TEAR\.env`). NUNCA commitar.
- `.gitignore` já ignora `.env` (versionar só `.env.example` sem valores).
- Variáveis: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY` (apenas servidor/scripts), `VITE_APP_NAME`.
- Para deploy: cadastrar as variáveis em Vercel → Environment Variables.
- `SUPABASE_SERVICE_ROLE_KEY` é crítica — jamais no front nem no GitHub.
