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
10. **Skill `frontend-design` (obrigatória em toda tela nova ou redesenho)** —
    usar sempre a skill oficial da Anthropic:
    https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md
    Pontos que valem como regra aqui:
    - **Partir do assunto** — a tela nasce do domínio (clínica de TEA: prontuário,
      guia, evolução, sessão), não de um template genérico.
    - **Herói como tese** — abrir a tela com o elemento mais característico do
      assunto, não com "número grande + gradiente" por hábito.
    - **Tipografia é personalidade** — escala e pesos intencionais (fontes TEAR),
      nunca neutros por omissão.
    - **Estrutura carrega significado** — divisores, numeração e rótulos só quando
      comunicam algo da informação.
    - **Movimento deliberado** — animação a serviço do conteúdo, sem efeitos
      espalhados.
    - **Dois passos antes de codar** — 1) plano de design (4–6 cores nomeadas,
      display/corpo/utilitária, layout em uma frase + wireframe ASCII, e UM
      elemento-assinatura); 2) crítica do plano: se algo parecer default de IA,
      refazer.
    - **Ousadia em um lugar só** — o elemento-assinatura carrega o risco; o resto
      fica quieto e disciplinado.
    - **Piso de qualidade** — responsivo, foco de teclado visível,
      `prefers-reduced-motion` respeitado.
    - **Texto é material de design** — voz ativa, escala do usuário ("Salvar
      alterações", não "Submeter"); erro e estado vazio são direção, não humor.

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

27. [FEITO — Correção #11] Conselho profissional condicional à especialidade
    (ProfessionalForm): mapa `specialtyCouncil` (lib/labels) sugere
    automaticamente o conselho ao escolher a especialidade principal; adiciona
    CRN (Nutrição) e CBO (áreas sem conselho federal) aos tipos, com descrição
    por extenso (`COUNCIL_LABELS` em lib/constants). Número do registro e UF
    seguem obrigatórios. Sugestão não sobrescreve escolha manual nem valor de
    profissional já gravado.

28. [FEITO — Correção #10] CID-11 no cadastro de pacientes com De-Para para
    CID-10 (migração 0025: colunas cid11_primary/secondary). Recorte curado
    `lib/cid11` focado em TEA/desenvolvimento, com mapeamento para o CID-10
    equivalente (ex.: 6A02→F84.0); `Cid11Combobox` buscável que aceita código
    personalizado. Ao selecionar o CID-11, o CID-10 correspondente é
    autopreenchido (compatibilidade com operadoras) e permanece editável;
    exibe código + descrição. CID-11 também disponível no formulário médico
    da evolução diária (#29).

29. [FEITO — Correção #12] Formulários de evolução diária dinâmicos por
    especialidade (migração 0026):
    - Remove definitivamente a especialidade `at_is` (AT — Integração
      Sensorial); recria o enum `specialty` sem o valor (nenhum registro o
      usava). Focos de T.O. (IS e AVDs) mantidos.
    - Renderização por tipo derivado da especialidade do profissional
      (`features/dailyEvolutions/formTypes`):
      * Aplicador ABA/AT: supervisor responsável, comportamentos-alvo e
        barreiras, tabela de programas de ensino (tentativas), níveis de ajuda
        (%) e análise da sessão.
      * Médico (neuropediatria/psiquiatria): anamnese, exame clínico,
        CID-11/CID-10 com De-Para, conduta medicamentosa, botões de receita/
        atestado/laudo.
      * Clínico: evolução técnica padrão (mantida). Devolutiva (#23) intacta.
    - Workflow de homologação técnica do AT: assinatura eletrônica simples →
      `validation_status='pendente_validacao'` → fila do supervisor (painel de
      pendências na listagem) → homologação com certificado A1 local
      (`SupervisorSignatureDialog`, reusa lib/digitalSignature). Decisão do
      projeto mantida: BirdID/Soluti descartado em favor do A1 local.
    - `structured_data` (jsonb) persiste métricas ABA e campos médicos para
      relatórios e futuros gráficos; a trava de 24h passa a congelar também
      `structured_data` (trigger `enforce_evolution_lock` atualizada). Colunas
      de workflow do supervisor ficam fora da lista protegida.
    - Timeline com filtro por especialidade (inner join em professionals) e
      badges de validação técnica.
    - Emissão de laudo na tela médica atualiza automaticamente a validade do
      laudo no cadastro do paciente (emissão + 1 ano).
    - PDF da evolução: tabela de programas ABA + bloco de homologação do
      supervisor; novos PDFs de receita/atestado/laudo (`exportMedicalDocumentPDF`).
    - DEFER: gráficos longitudinais (linha de base ABA) cross-sessão — os dados
      já são persistidos de forma estruturada; visualização agregada fica como
      follow-up.

30. [FEITO — Correções #13–#17] Pacote 6.
    - #13 Laudo vencido em /pacientes: filtro server-side (Todos / Vencido /
      A vencer 30d / Em dia / Sem laudo) persistido na URL (`?laudo=`) e nova
      coluna "Laudo" com badge contextual. `fetchPaginatedList` ganha ops
      `lt/gt/is`. Sem migração nova (usa `report_validity_date` do #5).
    - #14 "Erro na data" da evolução diária: causa raiz era off-by-one por
      fuso — `parseISO("yyyy-MM-dd")` em BR cai no dia anterior. Novo helper
      `lib/date.ts` (`parseDateOnly` / `todayLocalISO` / `daysUntil`)
      substituindo `parseISO` para colunas `date` em listas (evolutions,
      patients, authorizations, attendance, dashboard, audit) e no
      DatePicker. Default de período removido em /evolucoes (mostrava 14d
      silenciosamente, escondendo sessões antigas).
    - #15 Novo tipo "Liminar" (Judicial) no enum payment_type (migração 0027)
      + coluna `patients.liminar_number`. PatientForm: campos condicionais
      "Número da liminar" e "Operadora vinculada" (obrigatórios, Zod
      superRefine).
    - #16 Trava de data atual em nova evolução: trigger BEFORE INSERT
      `enforce_evolution_session_date` (migração 0028) recusa retroativa e
      futura. UI: DatePicker desabilitado em "novo", hint na tela e descarte
      do `session_date` de rascunho ao restaurar.
    - #17 Sigilo CFP/LGPD da evolução de Psicologia (migração 0029): coluna
      `is_confidential` + trigger que liga o sigilo à especialidade
      `psicologia_aba` do profissional; backfill de registros existentes.
      Helper RLS `is_psychologist_in_clinic` + nova policy SELECT que oculta
      registros sigilosos de quem não é `clinic_admin`, `platform_admin` ou
      psicólogo da clínica. Frontend: hook `usePsychologyUnlock` +
      `PsychologyUnlockDialog` (reauth com `signInWithPassword`, gate por
      aba via sessionStorage). Listagem mostra badge "Sigiloso (Psicologia)"
      e máscara para autorizados que ainda não destravaram a aba; o
      formulário/detalhe abre o gate antes de revelar o conteúdo.

31. [FEITO] Assinatura via ClickSign na evolução diária: botão "Assinar" na
    listagem gera o relatório da evolução em PDF (reuso do gerador jsPDF,
    agora com saída base64) e abre o envelope na ClickSign (API v3 —
    envelope → documento → signatário → requisitos [assinar + autenticação
    por e-mail] → ativação → notificação). Edge Function `clicksign-signature`
    (token `CLICKSIGN_TOKEN` só nos Secrets do servidor; opcional
    `CLICKSIGN_BASE_URL` para sandbox); acesso ao banco sempre com o JWT do
    usuário (RLS por clínica preservada). Coluna `daily_evolutions.clicksign`
    (jsonb, migração 0031, fora da lista protegida pela trava de 24h) guarda
    envelope/documento/signatário/status. `ClickSignDialog` na listagem:
    solicita assinatura (nome/e-mail/CPF), acompanha status pendente e
    "Verificar status" — quando o envelope finaliza, a função marca
    professional_signature + signed_at (preservando signed_at existente).
    Badges "Aguardando ClickSign" / "Assinada (ClickSign)". Ações diretas na
    lista: "Verificar assinatura" (envelopes pendentes) e "Baixar documento
    assinado" (envelopes finalizados — ação `download` busca a URL do PDF
    assinado na ClickSign via findSignedUrl e abre em nova aba). A detecção de
    conclusão aceita `closed`/`finished` e, quando o envelope ainda está
    `running`, inspeciona os signatários (auto_close assíncrono).
    - PENDENTE: cadastrar `CLICKSIGN_TOKEN` nos Secrets das Edge Functions
      (painel Supabase) — sem ele a função responde erro amigável.
    - DEFER: webhook da ClickSign para atualizar o status sem clique
      (hoje é polling manual pelo botão "Verificar status").

32. [FEITO — Módulo Clínicas] Gestão de tenants pelo Super Admin (rota
    `/clinicas`, visível apenas para `platform_admin`, item próprio na
    sidebar). Migrações 0033 (enum + coluna) e 0034 (funções que usam os novos
    valores — separadas porque Postgres não permite usar um valor de enum na
    mesma transação em que ele é criado).
    - **`clinics.status`** (`clinic_status`: em_implantacao / ativa / suspensa /
      encerrada) — situação operacional do contrato, distinta de `plan_status`
      (cobrança) e de `active` (chave de acesso). Salvar mantém `active`
      coerente com o status (suspensa/encerrada bloqueiam a clínica inteira).
      Backfill dos registros existentes conforme `active`.
    - **Novo papel `clinic_owner`** ("Administrador titular") no enum
      `member_role`; `is_clinic_admin()` passou a reconhecê-lo, então toda a RLS
      por clínica já o trata como administrador — nenhuma policy mudou.
    - **Criação do usuário admin com Auth**: Edge Function `clinic-admin-user`
      (verify_jwt + checagem de `platform_role`), única com service role —
      `admin.createUser` + upsert em `profiles` + vínculo em `clinic_members`
      como `clinic_owner`. Se o e-mail já existir no Auth, apenas vincula.
      Senha temporária gerada no servidor e exibida UMA vez na UI (nunca
      persistida); ação "Nova senha" redefine; revogar/liberar acesso alterna
      `clinic_members.active`.
    - **RPCs**: `platform_clinics_overview` ampliado (status, titular,
      admin_count, contato) e `platform_clinic_members` (equipe de uma clínica
      para o Super Admin, com e-mail canônico de auth.users).
    - **UI** (skill frontend-design): listagem com trilho colorido TEA por
      situação, filtros de busca e status persistidos na URL, alerta "sem
      administrador"; formulário em abas (Dados da clínica / Administradores)
      com CNPJ→BrasilAPI, CEP→endereço, plano e limites.
    - Super Admin deixou de duplicar o CRUD de clínicas: virou painel de
      números globais + atalho para o módulo (`features/superAdmin` removido,
      hooks unificados em `features/clinics/api.ts`).
    - Aplicado no projeto: migrações 0033/0034 rodadas e Edge Function
      `clinic-admin-user` publicada (verify_jwt). Não exige secret novo — usa a
      `SUPABASE_SERVICE_ROLE_KEY` que o runtime das Functions já injeta.

33. [FEITO — Assinatura digitalizada do profissional] Cada profissional pode ter
    a imagem da própria assinatura manuscrita, aplicada automaticamente nos
    relatórios que ele assina (migração 0035).
    - **Storage**: bucket PRIVADO `professional-signatures` (pasta raiz =
      clinic_id). Leitura para membros da clínica (necessária para gerar o PDF);
      escrita/remoção só para admin da clínica ou profissional com conta de
      acesso vinculada, via helper `can_manage_professional_signature`.
      Coluna `professionals.signature_path`.
    - **Cadastro de profissionais**: card "Assinatura digitalizada" com upload
      (PNG/JPG, até 2 MB), pré-visualização no formato da linha de assinatura do
      documento impresso, trocar e remover. O arquivo sobe ao salvar o cadastro
      (mesmo padrão do laudo do paciente).
    - **Aplicação nos relatórios**: helper `drawSignatureImage` no `lib/pdf`
      desenha a rubrica acima da linha de assinatura preservando a proporção
      (máx. 170×46pt); imagem inválida nunca quebra a emissão.
      * Evolução diária (PDF + envio à ClickSign): só quando
        `professional_signature = true`.
      * Evolução mensal (PDF + documento na tela `ReportDocument`): só quando
        `signed_at` ou `approved`.
      Documento em aberto/rascunho NUNCA sai com a rubrica aplicada — a imagem
      é o elemento visual, o valor jurídico continua vindo da assinatura
      ICP-Brasil (A1) ou do aceite eletrônico registrado.
    - Aplicado no projeto: migração 0035 rodada.
    - DEFER: rubrica nos demais documentos (receita/atestado/laudo médico,
      histórico de frequência, devolutiva aos pais) e rubrica do supervisor no
      bloco de homologação técnica.

34. [FEITO — Evolução mensal OU por período + assinatura em lote] (migração
    0036).
    - **Recorte do relatório**: enum `monthly_period_type` (`mensal` |
      `periodo`) + colunas `period_start`/`period_end` em monthly_evolutions
      (backfill do intervalo do mês nos registros existentes). As datas passam
      a ser a fonte única de verdade para agregação, PDF de frequência e
      rótulos; `reference_month/year` continuam preenchidos (no período, vêm da
      data inicial) para ordenação e filtro por ano.
    - Anti-duplicidade por recorte: a unique paciente+mês+ano virou índice
      parcial só do `mensal`; o `periodo` tem unique parcial por
      paciente+intervalo (mesmo intervalo exato é barrado, recortes diferentes
      no mesmo mês são permitidos).
    - **MonthlyGenerate**: seletor "Mensal / Por período"; no período abre
      DatePicker de → até com validação Zod (final ≥ inicial e não futura). A
      trava de 22 dias (mês fechado) continua valendo só no recorte mensal.
    - Motor `buildMonthlySummary` deixou de receber mês/ano e passou a receber
      `periodLabel` — mesmo texto serve aos dois recortes.
    - **Assinatura em lote na listagem**: botão "Assinar" abre diálogo que lista
      as evoluções da página, marca as aprovadas (`aguardando_assinatura`) e
      assina todas com UM certificado A1 (`loadA1Certificate` +
      `signPayloadWithCertificate` — o .pfx é aberto uma vez e cada relatório
      recebe envelope PKCS#7 próprio, vinculado ao seu hash). Falha isolada não
      derruba o lote. O fluxo de aprovação é preservado: rascunho/pendente
      aparecem no diálogo com o motivo, desabilitados.
    - **Download do assinado**: linha assinada ganha o botão "Assinado"
      (ícone de download) que emite o PDF com a rubrica do profissional e o
      bloco da assinatura digital (titular/CPF/emissor/hash/data). O arquivo é
      gerado do registro assinado; não há cópia em Storage.
    - Aplicado no projeto: migração 0036 rodada e release em produção.

35. [FEITO — Duas formas de assinar a evolução mensal] (migração 0037).
    - Enum `monthly_signature_method` (`certificado` | `digital`) + coluna
      `signature_method` em monthly_evolutions (backfill: quem já tinha
      `digital_signature` recebeu `certificado`).
    - **Assinar com certificado** — o fluxo antigo "Assinar digitalmente",
      renomeado: certificado A1 ICP-Brasil local, envelope PKCS#7 em
      `digital_signature`. Dialog `MonthlyCertificateDialog`.
    - **Assinatura digital** — aplica no relatório a assinatura digitalizada
      do cadastro do profissional (`professionals.signature_path`, #33), com
      registro de data/hora; sem certificado. Dialog `MonthlyRubricDialog`
      mostra a rubrica antes de confirmar.
    - Blindagem server-side: trigger `enforce_monthly_signature_method` recusa
      `signature_method='digital'` quando o profissional não tem rubrica
      cadastrada (o documento sairia sem marca de autoria).
    - Ambos partem de `aguardando_assinatura` e levam a `assinada` — o fluxo de
      aprovação do coordenador continua igual.
    - Assinatura em lote da listagem ganhou o seletor de método; na forma
      digital não pede certificado e marca como inelegível a linha cujo
      profissional não tem rubrica.
    - PDF: além da rubrica, a forma digital imprime "Assinado eletronicamente
      por [nome] em [data/hora]"; a forma certificado mantém o bloco
      ICP-Brasil (titular/CPF/emissor/hash).
    - Aplicado no projeto: migração 0037 rodada e release em produção.

36. [FEITO — Rubrica em todos os relatórios] Conclui o DEFER do #33: a
    assinatura digitalizada do profissional passa a valer em todo documento
    emitido, sempre com a mesma regra — documento em aberto NUNCA sai com a
    rubrica aplicada.
    - Devolutiva para os Pais: rubrica nas duas vias, quando a evolução está
      assinada (`professional_signature`).
    - Receita / atestado / laudo médico: mesma regra (evolução assinada).
    - Histórico de frequência: rubrica quando a evolução mensal de origem já
      está assinada ou aprovada (gate no chamador, que conhece o status).
    - Homologação técnica do supervisor (evolução diária, PDF e envio à
      ClickSign): rubrica do supervisor quando `supervisor_signature` existe.
    - `lib/pdf`: `fitSignature` extraído; `drawSignatureImage` (fluxo do
      documento) e `drawSignatureImageAbove` (encosta a rubrica acima de uma
      linha já posicionada, para layouts de página fixa).

36. [FEITO — Recuperação de senha] Fluxo completo de "esqueci minha senha",
    sem migração (usa o Supabase Auth).
    - **Rotas**: `/esqueci-senha` (pedir o link, sob `RedirectIfAuthed`) e
      `/redefinir-senha` (criar a nova senha). A segunda fica FORA do
      `RedirectIfAuthed` de propósito: o link do e-mail já autentica o usuário
      e o guarda o jogaria no dashboard sem trocar a senha.
    - **Link do e-mail**: `resetPasswordForEmail(email, { redirectTo })` com
      `redirectTo = ${origin}/redefinir-senha` (`lib/authRecovery`). O
      supabase-js consome o token do fragmento da URL (`detectSessionInUrl`),
      cria a sessão de recuperação e a página troca a senha com
      `updateUser({ password })`; em seguida faz signOut e devolve ao login.
    - `lib/authRecovery` é importado por `lib/supabase` ANTES do
      `createClient` porque guarda o retrato dos parâmetros de retorno na URL
      (`error`, `error_code`, `type`) — o client os apaga ao processar. Só
      campos de diagnóstico entram no retrato; nunca o token. Link expirado ou
      já usado vira tela "Link não validado" com atalho para pedir outro.
    - **Regra de senha** (`lib/password`): mínimo de 8 caracteres com letra e
      número (o mínimo do Supabase é 6), medidor de força nas cores da marca e
      confirmação obrigatória. `PasswordInput` (mostrar/ocultar) também passou
      a ser usado no login.
    - **UI** (skill frontend-design): `AuthLayout` extraído do login — as três
      telas de acesso compartilham o painel da marca; elemento-assinatura é o
      trilho `RecoverySteps`, em que as barras coloridas TEAR viram as etapas
      (Pedir link → Conferir e-mail → Nova senha). Confirmação neutra ("se
      existir uma conta…") para não revelar e-mails cadastrados, reenvio com
      contagem de 60s e tratamento do erro 429.
    - PENDENTE no painel Supabase (não acessível pela API/MCP):
      Authentication → URL Configuration → **Redirect URLs** precisa listar
      `https://<domínio-de-produção>/redefinir-senha` (e
      `http://localhost:5173/redefinir-senha` para desenvolvimento); sem isso
      o Supabase devolve ao Site URL e o link não valida. O template
      "Reset Password" pode seguir com `{{ .ConfirmationURL }}` — é ele que
      carrega o `redirect_to` enviado pelo app.

37. [FEITO — Tenant ativo correto + seletor de clínica] Sem migração.
    - **Bug corrigido**: a query do `ClinicProvider` lia `clinic_members` sem
      `.eq("user_id", ...)`, confiando na RLS para recortar. Mas
      `clinic_members_select` é `is_clinic_member(clinic_id) OR
      is_platform_admin()` — devolve TODOS os membros das clínicas do usuário
      e, para platform_admin, a tabela inteira. Com `order(joined_at) limit 1`
      o vínculo "ativo" acabava sendo o de outra pessoa (papel errado no front)
      ou, no caso do platform_admin, o da clínica mais antiga da plataforma —
      o app inteiro (topbar, dashboard, listagens) operava no tenant errado.
      Verificado em produção: o titular da clínica "New Person"
      (platform_admin) via e usava os dados da "Clínica DAPV".
    - A RLS nunca vazou nada: o recorte por tenant continuou íntegro; o erro
      era o front escolher mal entre as linhas que a RLS legitimamente entrega.
      Para membros comuns o efeito era inflação de papel só na UI (mutação
      seguia barrada por `is_clinic_admin`, que checa `auth.uid()`).
    - O provider passou a carregar TODOS os vínculos ativos do usuário
      (`memberships`) e a expor `switchClinic`. O tenant ativo é o escolhido,
      com fallback para o primeiro vínculo; a escolha mora em
      `tear:active-clinic:<userId>` (localStorage, só o id da clínica) e é
      sempre validada contra os vínculos vindos do banco.
    - **`ClinicSwitcher`** no topbar: com um vínculo é apenas o rótulo (não
      oferecer menu que não leva a lugar nenhum); com dois ou mais vira
      dropdown com marca, nome e papel por clínica. Trocar descarta os caches
      (`removeQueries` preservando `current-clinic` — as keys de detalhe são
      indexadas só pelo id da linha) e devolve ao dashboard, porque a tela
      atual pode apontar para registro de outro tenant. No celular fica só a
      marca + chevron.
    - NOTA: platform_admin sem nenhum vínculo agora cai no `/onboarding`
      (antes herdava uma clínica alheia). As rotas `/clinicas` e
      `/super-admin` ficam sob `RequireClinic`, então esse admin não alcança o
      módulo de clínicas — revisar o guard se o caso aparecer.

38. [FEITO — Quebra de página nos PDFs] Correção do conteúdo cortado no pé da
    página nos relatórios emitidos (`lib/pdf.ts`), sem migração.
    - **Causa**: os geradores escreviam blocos de texto com
      `doc.text(linhas, x, y)` num `y` que só crescia — o jsPDF não quebra
      página sozinho, então tudo que passava do fim da folha era desenhado fora
      da área imprimível e sumia. No caso reportado (evolução mensal assinada),
      10 linhas da "Análise profissional" foram perdidas.
    - **Motor de fluxo** (`createFlow`): escreve LINHA A LINHA e abre página
      nova quando a próxima não cabe acima da faixa do rodapé
      (`FOOTER_RESERVE`). Um bloco maior que a página continua na seguinte em
      vez de ser cortado. `heading()` evita título órfão (só entra se couber
      com ~2 linhas do corpo).
    - **Blocos indivisíveis**: assinatura e homologação têm as linhas quebradas
      ANTES da reserva de espaço, então rubrica + nome + dados do certificado
      saem sempre na mesma página (antes a reserva era um valor fixo, menor que
      o bloco com metadados ICP-Brasil).
    - **Páginas de continuação**: cabeçalho reduzido (documento · paciente ·
      período) e rodapé em TODAS as páginas, com "Página X de Y" — inclusive
      nas criadas pelo autoTable (via `didDrawPage` + `margin.top`).
    - Aplicado em: evolução mensal/por período, evolução diária (seções
      clínicas longas) e histórico de frequência.
    - DEFER: devolutiva aos pais e documentos médicos (receita/atestado/laudo)
      ainda escrevem o corpo em `y` fixo — só quebram se o texto passar do
      bloco de assinatura, situação não observada até agora.

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
- [FEITO — Fase 3] Vínculo profissional↔usuário + bloqueio de acesso do
  inativo. ClinicProvider já barra membro inativo (.eq active true). No
  ProfessionalForm, campo "Conta de acesso (membro)" grava professionals.
  user_id. useSetProfessionalActive sincroniza o membro: inativar o
  profissional vinculado revoga o acesso (clinic_members.active=false);
  reativar restaura. Só admin sincroniza (RLS) e há proteção do último admin.
- [FEITO — Fase 4] Gate preciso do Coordenador na aprovação mensal:
  `useMyProfessional` (profissional vinculado ao usuário logado); em
  MonthlyDetail, `canReview` libera Aprovar/Recusar para clinic_admin OU para o
  coordenador cuja `coordinator_specialty` casa com a especialidade do
  profissional da evolução. `reviewer_id` gravado na aprovação.

Fase 2 restante: Asaas billing.

## Controle de sessão

- A sessão do usuário vive enquanto a sessão do **navegador** viver: o token do
  Supabase Auth é gravado em `sessionStorage` (`lib/authStorage.ts`), não em
  `localStorage`. Fechar o navegador/aba exige novo login; recarregar a página
  (F5) mantém o login.
- Consequência aceita nesse modo: cada aba tem sua própria sessão — abrir o app
  em uma nova aba pede login. É o preço de não deixar credencial persistida em
  máquina compartilhada da clínica.
- **"Manter conectado neste dispositivo"** (checkbox no login): liga o modo
  `localStorage` — a sessão sobrevive ao reinício do navegador e é compartilhada
  entre abas. A preferência mora em `tear:remember-me` (localStorage) e é lida
  pelo storage adapter a cada chamada; `setRememberMe()` migra o token já
  gravado entre os dois storages, então alternar não derruba a sessão ativa.
  Padrão: desligado.
- **Logout automático por inatividade** (`config/session.ts` +
  `components/session/SessionTimeoutGuard.tsx`): 30min sem interação encerram a
  sessão, com aviso 1min antes (contador regressivo, "Continuar conectado" /
  "Sair agora"). Vale nos dois modos. Um único timer de 1s compara o relógio —
  assim a regra também vale quando a máquina dorme. Durante o aviso o
  rastreamento de atividade pausa: renovar exige clique explícito (mouse
  tremendo em tela desatendida não conta como presença). A contagem reinicia a
  cada carregamento da página — o alvo é a tela aberta e sem ninguém na frente,
  não punir quem volta no dia seguinte com "lembrar-me" ligado.
- No boot, `purgeLegacyPersistentSession()` apaga tokens `sb-*-auth-token`
  remanescentes em `localStorage` — só quando "lembrar-me" está desligado.
- `signOut()` limpa rascunhos clínicos (LGPD) e chama `clearStoredSession()`,
  que apaga o token nos dois storages.
- Sem Web Storage (modo privado/webview restrito), cai para storage em memória —
  mesma regra, sessão morre com a página.
- Tela de login informa a regra vigente conforme a opção marcada.

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

## Estratégia de segurança e performance (padrões distribuídos)

Avaliação padrão a padrão: o que a stack (Supabase/PostgREST/React Query) já
cobre, o que o TEAR implementa por cima e o que é decisão consciente de não
fazer. Reavaliar a cada incremento que adicione escrita concorrente, fila ou
integração externa.

- **CQRS** — adotado na forma leve ("CQRS-lite"), sem event sourcing:
  escrita via tabelas com RLS + RPCs transacionais (`save_plan_with_goals`,
  `redeem_clinic_invite`); leitura via read-models dedicados quando o shape
  difere da tabela (RPCs `platform_clinics_overview`, `clinic_members_overview`,
  motor `buildMonthlySummary` como projeção calculada). DECISÃO: não separar
  bancos/streams de leitura — escala de clínica não justifica; manter o padrão
  "leituras agregadas = RPC SECURITY DEFINER gated por papel".
- **Idempotência** — resgate de convite é idempotente (membro ativo → no-op);
  unique constraints (mensal por paciente+período, membro por clínica+usuário)
  + upserts com `onConflict` são o backstop de duplo clique/retry do front
  (React Query `retry: 1` só em query, mutações não fazem retry automático).
  ClickSign tem guarda de aplicação (409 se envelope pendente). REGRA: toda
  mutação nova precisa responder "o que acontece se rodar 2x?" — a resposta
  deve ser constraint/on conflict/no-op, nunca "o front não deixa".
- **Race condition** — checagens read-then-act do front NÃO são garantia;
  garantia é server-side: anti-sobreposição de sessão via trigger
  `enforce_evolution_no_overlap` com `pg_advisory_xact_lock` por paciente+data
  (migração 0038); `redeem_clinic_invite` com `FOR UPDATE`; `used_quantity`
  com incremento atômico (`set used = used + 1`, nunca read-modify-write).
  ACEITO: `used_quantity` pode ultrapassar o autorizado sob corrida (o front
  alerta guia esgotada mas não bloqueia) — auditoria/faturamento detecta.
- **Dual write** — superfícies: Storage + coluna no banco (laudo, rubrica,
  atestado) e ClickSign + jsonb `clicksign`. REGRA de ordem: efeito externo
  primeiro, banco por último — arquivo órfão no Storage é o modo de falha
  seguro (bucket privado, sem referência); linha apontando para arquivo
  inexistente não. Para ClickSign, o "Verificar status" repõe estado perdido
  (reconciliação por polling). DECISÃO: sem outbox pattern por ora — não há
  fila de eventos; reavaliar quando houver webhook/Asaas.
- **DLQ / poison message** — hoje NÃO há processamento assíncrono (sem filas,
  sem webhooks; ClickSign é polling manual). REGRA para quando houver (webhook
  ClickSign, billing Asaas fase 2): usar Supabase Queues (pgmq) com
  `max_retries` + tabela de dead-letter; handler de webhook idempotente
  (processar por id de evento com unique constraint) e nunca deixar mensagem
  malformada travar a fila — capturar, gravar na DLQ, seguir.
- **Rate limit** — o Supabase só limita endpoints do Auth (login, reset — e o
  reset já trata 429 na UI); PostgREST e Edge Functions não têm limite por
  usuário nativo. DECISÃO DO DONO: NÃO limitar uso/custo — o usuário pode
  chamar as funções (IA, ClickSign, admin) quantas vezes precisar; nenhuma
  Edge Function tem limite de chamadas. Rate limit no TEAR é ferramenta de
  SEGURANÇA apenas: RPC `check_rate_limit` (janela fixa por ação:usuário,
  migração 0038, tabela sem acesso direto pela API), hoje usada só no
  `redeem_clinic_invite` (10 tentativas/10min — anti-brute-force de código).
  REGRA: aplicar `check_rate_limit` somente onde há segredo adivinhável
  (códigos, tokens); nunca sobre uso legítimo de funcionalidade.
- **Timing attack** — senha/sessão são do Supabase Auth (bcrypt, comparação
  segura — não reimplementar). Superfície própria: código de convite (busca por
  igualdade em índice único — sinal de timing desprezível; o risco real era
  enumeração dos códigos legados de 8 hex, agora barrada pelo rate limit do
  resgate; códigos novos têm 16 hex). Mensagens de erro uniformes ("Convite
  inválido ou expirado", "se existir uma conta…") para não vazar existência.
  REGRA: nunca comparar segredo com `=` em SQL/JS próprio; se um dia houver
  token próprio (API key de integração), armazenar hash e comparar digest.
- **Poison message (entrada hostil)** — nas Functions: limite de corpo
  (64KB–14MB conforme função), parse defensivo de JSON, limites de contagem
  (MAX_GOALS) e resposta genérica ao cliente com detalhe só no log. No front:
  busca sanitizada contra injeção PostgREST. REGRA: toda entrada que atravessa
  um parser (JSON, base64, PDF) tem limite de tamanho ANTES do parse.
- **Cache stampede** — React Query já deduplica queries idênticas concorrentes
  por cliente (staleTime 30s default; listas frias 30–50min); não há cache
  compartilhado server-side (sem Redis/CDN de API) — logo não existe chave
  quente cuja expiração derrube o banco. Dashboard agrega por tenant (dezenas
  de usuários, não milhares). DECISÃO: não introduzir camada de cache; se um
  agregado ficar caro, materializar via RPC/matview com refresh agendado
  (pg_cron) em vez de cache com TTL.

### Agentes por incremento
backend, frontend, ux, ui, code-review. Cada peça passa por review antes do PR.

## Segredos / .env

- O `.env` fica **somente local** (`C:\sistemas\TEAR\.env`). NUNCA commitar.
- `.gitignore` já ignora `.env` (versionar só `.env.example` sem valores).
- Variáveis: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY` (apenas servidor/scripts), `VITE_APP_NAME`.
- Para deploy: cadastrar as variáveis em Vercel → Environment Variables.
- `SUPABASE_SERVICE_ROLE_KEY` é crítica — jamais no front nem no GitHub.
