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
8. [FEITO] Frequência/Presença (CRUD, filtro por paciente+período, justificativa
   condicional ao status, registro de assinatura do responsável).
9. [FEITO] Evolução mensal — motor de geração automática agrega frequência,
   evoluções diárias e progresso das metas; análise profissional editável;
   aprovação; exportação em PDF (jsPDF + autotable) com cabeçalho da marca.
   - Limitações conhecidas: sem unique constraint paciente+mês+ano (duplicatas
     possíveis); aprovar é idempotente (não checa estado anterior).
10. [FEITO] Auditoria/Faturamento — regras dinâmicas (BILLING_RULES sem
    hardcode nas páginas), dashboard de conformidade com taxa por regra,
    lista de sessões pendentes (link para corrigir), viewer de audit_logs.
    - Limitação conhecida: auto-rastreamento de eventos ainda não habilitado
      (precisa de triggers Postgres ou wrappers de mutação para escrever em
      audit_logs); viewer já está pronto para quando ativarmos.
11. [FEITO] Dashboard — métricas reais (pacientes ativos, sessões da semana,
    guias vigentes, taxa de presença 30d), gráficos (sessões últimos 14d em
    area chart, distribuição de avaliações em bar chart) e lista de guias
    a vencer (30d) com link direto para correção.
12. [FEITO] Configurações → Layout (por tenant): upload de logo no Supabase
    Storage (bucket `clinic-assets`, RLS por clinic_admin), editor de paleta
    (primary/accent) aplicado em runtime via CSS variables (ThemeApplier),
    pré-visualização e reset para o padrão TEAR. Só clinic_admin edita.
13. [FEITO] Super Admin: RPC `platform_clinics_overview` (SECURITY DEFINER
    gated por is_platform_admin), guard de rota, item de menu visível só
    para platform_admin, página com métricas globais (clínicas/membros/
    pacientes/sessões 30d) e tabela com edição inline de plano/status +
    ativar/desativar clínica.
14. [FEITO — Pacote 1] Automações BrasilAPI (CEP→endereço em PatientForm
    e Onboarding, CNPJ→empresa em Onboarding) e Combobox buscável (cmdk
    + Popover) substituindo Selects de paciente/profissional em todos os
    formulários.
15. [FEITO — Pacote 2] DatePicker (react-day-picker 9 + Popover, locale
    PT-BR) substituindo native date inputs em todos os formulários e
    filtros; TagInput para skills_worked; color picker react-colorful em
    Configurações.
16. [FEITO — Pacote 3] Robustez de dados via triggers e RPCs server-side:
    - Auto-rastreamento em audit_logs (INSERT/UPDATE/DELETE em todas as
      tabelas clínicas).
    - Lock 24h server-side em daily_evolutions (BEFORE UPDATE) — bloqueia
      alteração de qualquer campo significativo após o prazo.
    - used_quantity da guia atualizado automaticamente ao criar/remover/
      realocar evolução.
    - Unique constraint (patient, year, month) em monthly_evolutions.
    - RPC atômica `save_plan_with_goals` (transação no Postgres),
      substituindo o sequencial do front; sem mais estado parcial em falha.
    - Hardening: search_path imutável + trigger functions sem EXECUTE pela
      API REST.

17. [FEITO — Pacote 4] UX adicional:
    - CID-10 autocomplete (`CidCombobox`) com recorte curado (~80 códigos
      para TEA/desenvolvimento infantil) em cid10_primary e secondary do
      paciente; aceita código personalizado se fora do recorte.
    - `useUrlState`/`useUrlNumber` (react-router useSearchParams) — filtros
      e página persistidos na URL (refresh/back/forward/compartilhar link
      preservam estado) em DailyEvolutionsList, AttendanceList, MonthlyList
      e AuditDashboard.
    - Auto-save de rascunho em DailyEvolutionForm via localStorage por
      clinic_id (subscribe do RHF, debounce 800ms); restaura ao abrir
      "Nova evolução" e limpa no submit. Indicador "Rascunho salvo às HH:mm".
    - Sortable headers em PatientsList e ProfessionalsList (server-side
      via .order do PostgREST) com indicador de direção; primitiva
      ui/sortable-head reutilizável.

18. [FEITO — Pacote 5] Motor mensal IA-free
    (`features/monthlyEvolutions/summary.ts`): gera as 6 seções do legado
    (síntese / habilidades / progressos / desafios / conclusão /
    recomendações) por regras condicionais, computa tendências (assessment
    e prompting comparando 1ª e 2ª metade do mês), agrega top-skills,
    classifica metas adquiridas e com maior progresso. Sem provedor
    externo, dado clínico nunca sai do banco. Substitui o uso de LLM do
    legado (Gemini via Manus Forge) para o relatório mensal.

19. [FEITO — Correção #2] Evolução diária — 3 itens reportados:
    - Trava de 24h ancorada na ASSINATURA (signed_at), não mais na criação:
      trigger server-side `enforce_evolution_lock` e `isLocked` client-side
      atualizados. Enquanto não assinada, a evolução é editável; após 24h da
      assinatura, só adendo corrige.
    - Adendo / nota de retificação (`AddendumSection` + `useAddAddendum`)
      gravado na coluna `addendum` (jsonb, fora da lista protegida pela
      trigger): anexa correções sem alterar o registro original; aparece no
      PDF. UX exibida quando travada ou quando já há adendos.
    - Síntese da evolução em PDF (`exportDailyEvolutionPDF`, jsPDF): cabeçalho
      institucional, identificação do paciente, dados do profissional
      (nome + conselho), conteúdo clínico, adendos e bloco de assinatura.
    - Assinatura digital ICP-Brasil (A1) 100% local (`lib/digitalSignature.ts`
      via node-forge + `SignatureDialog`): o usuário usa o certificado da
      própria máquina (.pfx/.p12); gera envelope PKCS#7 + SHA-256, extrai
      titular/CPF/emissor do certificado e grava em `digital_signature`
      (coluna jsonb nova, migração 0014). Status "Assinada digitalmente".
      Sem provedor externo — chave privada e dado clínico nunca saem do
      navegador.
      - NOTA: A3 (token/smartcard) exige componente nativo/extensão; hoje
        suportado apenas A1 (arquivo). BirdID/Soluti em nuvem foi descartado
        em favor do certificado local (sem contrato/credenciais externas).

20. [FEITO — Correção #7] Profissional ativo/inativo (soft-delete reversível):
    filtro de status (Ativos/Inativos/Todos) na listagem, badge "Inativo",
    ação Inativar/Reativar (`useSetProfessionalActive`) com confirmação, e
    card de status no cadastro. Inativar oculta o profissional de todas as
    seleções operacionais (options já filtram active=true) preservando o
    histórico; reativar restaura. Estado persistido na URL.
    - PENDENTE (depende de gestão de membros, ainda não implementada): bloqueio
      imediato de LOGIN do profissional inativo. Hoje o bloqueio é operacional
      (some de listas/seleções); a revogação de acesso via Supabase Auth/
      clinic_members será feita quando o módulo de membros existir.

(Backlog de correções abertas consolidado ao fim desta seção.)

21. [FEITO — Integração IA Claude] Edge Function `claude-analysis` (Supabase
    Functions, Deno + `@anthropic-ai/sdk`, modelo `claude-opus-4-8`): a chave
    `CLAUDE_KEY` fica só nos Secrets do servidor; o front chama a função
    autenticado pelo JWT (verify_jwt). Primeiro uso: botão "Gerar com IA" na
    Análise profissional da Evolução mensal — gera um rascunho do
    `professional_review` a partir dos agregados clínicos já calculados
    (síntese, metas, frequência), que o profissional revisa e salva.
    - Privacidade/LGPD: envia só agregados (sem nome/CPF do paciente). É um
      provedor externo (Anthropic) — diferente do motor mensal IA-free (#18),
      que nunca sai do banco. O uso é opt-in por clique.
    - Hook `features/ai/api.ts` (`useGenerateMonthlyAnalysis`) via
      `supabase.functions.invoke`. CSP já permite `*.supabase.co`.
    - PENDENTE: validar a chamada ponta-a-ponta no app (o sandbox de
      desenvolvimento bloqueia egress p/ *.supabase.co; a função em si roda na
      infra do Supabase, que alcança api.anthropic.com).

22. [FEITO — Correção #5 (núcleo)] Laudo médico + OCR/IA:
    - Campo de diagnóstico generalizado ("Diagnóstico / Condição de Saúde").
    - Colunas do laudo em patients (report_doctor, report_crm,
      report_issue_date, report_validity_date, report_path) + bucket privado
      `medical-reports` (RLS por clinic_id) — migração 0016.
    - Edge Function `claude-extract-laudo` (Claude vision/PDF, claude-opus-4-8):
      extrai médico, CRM/UF, emissão e validade do laudo. Cenário A (validade
      explícita) e Cenário B (sem validade → emissão + 1 ano). Campos sempre
      editáveis.
    - PatientForm: upload do laudo (PDF/imagem), botão "Ler com IA" que
      preenche os campos, link assinado para o laudo atual e alerta de
      vencimento (vencido / vence em ≤15 dias).
    - DEFER (restante do #5): obrigatoriedade do laudo no cadastro,
      notificação de vencimento na tela inicial e histórico permanente de
      múltiplos laudos por paciente.

23. [FEITO — Correção #8] Evolução "Devolutiva para os Pais":
    - Novo tipo de atendimento `devolutiva_pais` (enum) + coluna
      `parent_feedback` jsonb em daily_evolutions (migração 0017).
    - DailyEvolutionForm: ao escolher "Devolutiva para os Pais", oculta o
      formulário técnico (habilidades/comportamental/síntese/guia/plano) e
      mostra layout exclusivo com aviso de linguagem acessível + 3 campos
      (atividades anteriores, próximas, orientação para casa). Validação Zod
      condicional (superRefine). Síntese/próximo passo recebem versões legíveis
      p/ satisfazer colunas obrigatórias.
    - PDF "Imprimir Devolutiva" (`exportParentFeedbackPDF`) em 2 vias (Via da
      Clínica / Via dos Pais) com identificação, os 3 campos e assinatura
      física do responsável.

24. [FEITO — Correção #9] Frequência: ciência dos pais + atestado + cobrança.
    - Colunas em attendance_records (migração 0018): absence_reason,
      attachment_path, guardian_ack_method, notified_in_time, billable_absence
      + bucket privado `attendance-attachments` (RLS por clinic_id).
    - AttendanceForm: ciência do responsável com método de validação
      (assinatura na tela/biometria/token/presencial); detalhamento dinâmico de
      falta (motivo, justificativa, upload de atestado) e pergunta de aviso em
      tempo hábil → marca `billable_absence` (falta tardia = faturável).
    - AttendanceList: badge "Passível de cobrança".
    - DEFER: gating de exportação de faturamento por "presença confirmada"
      (integrar ao módulo de auditoria/BILLING_RULES, #10).

25. [FEITO — Correção #6] Especialidades multi-seleção + papéis de gestão.
    - Novos valores do enum specialty (terapia_ocupacional, neuropediatria,
      psiquiatria, nutricao, psicomotricidade_funcional/relacional,
      aplicador_aba_domiciliar/escolar, at_is).
    - Tabela N:N `professional_specialties` (RLS por clinic_id + audit) com
      backfill da especialidade atual; `professionals.specialty` permanece como
      PRINCIPAL (compat. com listas/PDF/seletores). Migração 0019.
    - Papéis como campos no profissional (decisão do dono): `coordinator_
      specialty` (coordenador → poderá aprovar a evolução mensal do #3/#4) e
      `is_at_supervisor`.
    - ProfessionalForm: grade de checkboxes de especialidades (principal = 1ª),
      reconciliação N:N ao salvar (useSaveProfessionalSpecialties), card
      "Papéis de gestão" (coordenador + especialidade coordenada + supervisor
      de AT).

26. [FEITO — Correções #3 e #4] Evolução mensal: workflow + trava 22 dias +
    assinatura + PDF.
    - Enum `monthly_status` (rascunho → pendente_aprovacao →
      aguardando_assinatura | ajustes_solicitados → assinada) + colunas
      (submitted_at, reviewer_id/name, rejection_reason, reviewed_at,
      digital_signature, signed_at). Migração 0020.
    - Trava de 22 dias no gerador (MonthlyGenerate): bloqueia meses futuros e o
      mês corrente antes de 22 dias corridos, com a mensagem do critério.
    - Workflow (MonthlyDetail): rascunho/ajustes editáveis + "Enviar para
      aprovação"; coordenador (gate por clinic_admin — ver nota) Aprova ou
      "Solicita ajustes" com justificativa (banner exibido ao profissional);
      aprovação → "Aguardando assinatura"; assinatura digital A1 local
      (MonthlySignatureDialog, reusa lib/digitalSignature) → "Assinada".
    - PDF: carimbo "Aprovado pelo coordenador [Nome]" + bloco da assinatura
      digital (titular/CPF/emissor/hash/data).
    - NOTA (gate do coordenador): a aprovação é liberada para clinic_admin como
      stand-in operacional do "Coordenador de Especialidade" (#6 já gravou
      coordinator_specialty no profissional). O gate preciso por
      profissional↔usuário↔especialidade depende da gestão de membros (ainda
      não implementada).

Todas as correções da tabela public.corrections foram resolvidas.

## Gestão de Membros
- [FEITO — Fase 1] Aba Configurações → Membros: RPC `clinic_members_overview`
  (SECURITY DEFINER, expõe nome/e-mail dos membros sem afrouxar
  profiles_select), listar/trocar papel/ativar-inativar (só clinic_admin) com
  guarda de "último admin ativo". Migração 0021 (+audit em clinic_members).
- [FEITO — Fase 2] Convite por link/código: tabela `clinic_invites` (RLS por
  admin + audit) + RPCs `create_clinic_invite` (gera código/papel/validade) e
  `redeem_clinic_invite` (usuário resgata e entra na clínica). UI: gerar/
  copiar/revogar convites na aba Membros; box "Tem um convite?" no Onboarding
  (lê `?invite=CODE`). Migração 0022.
- [PENDENTE — Fase 3] Vínculo profissional↔usuário (professionals.user_id) +
  bloqueio de acesso do membro/profissional inativo.
- [PENDENTE — Fase 4] Gate preciso do Coordenador na aprovação mensal
  (substituir o stand-in clinic_admin) via vínculo + coordinator_specialty.

Fase 2 restante: Asaas billing.

## Segurança e LGPD

- **Headers HTTP** (vercel.json): HSTS preload, X-Content-Type-Options, X-Frame-Options DENY, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy bloqueando câmera/microfone/geolocalização, Cross-Origin policies, CSP restritivo (script-src self, conexão só a Supabase + BrasilAPI, frame-ancestors none).
- **RLS sensível**: `audit_logs` SELECT restrito a clinic_admin/platform_admin (terapeutas/recepcionistas não veem CPFs em logs).
- **LGPD Art. 18**:
  - Tabela `data_deletion_requests` + RPC `request_my_data_deletion` (usuário abre solicitação; platform_admin processa em até 15 dias).
  - RPC `export_my_data` para portabilidade (JSON com perfil, vínculos, solicitações).
  - Página `/privacidade` com política em PT-BR cobrindo bases legais, retenção (20 anos para prontuário — CFM 1.821/2007), direitos do titular, segurança.
  - Aba "Privacidade (LGPD)" em Configurações com botões "Exportar JSON" e "Solicitar exclusão".
- **Pendências no painel Supabase** (não acessíveis via API):
  - Habilitar **Leaked Password Protection** (HaveIBeenPwned).
  - Habilitar **Email confirmation** em produção.
  - Considerar **MFA TOTP** para platform_admin/clinic_admin.

### Agentes por incremento
backend, frontend, ux, ui, code-review. Cada peça passa por review antes do PR.

## Segredos / .env

- O `.env` fica **somente local** (`C:\sistemas\TEAR\.env`). NUNCA commitar.
- `.gitignore` já ignora `.env` (versionar só `.env.example` sem valores).
- Variáveis: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY` (apenas servidor/scripts), `VITE_APP_NAME`.
- Para deploy: cadastrar as variáveis em Vercel → Environment Variables.
- `SUPABASE_SERVICE_ROLE_KEY` é crítica — jamais no front nem no GitHub.
