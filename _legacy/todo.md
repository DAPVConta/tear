# Prontuário Eletrônico TEA - TODO

- [x] Schema do banco de dados (pacientes, profissionais, guias, PTS, evoluções, presença)
- [x] API backend - CRUD de pacientes
- [x] API backend - CRUD de profissionais/terapeutas
- [x] API backend - Gestão de guias/autorizações
- [x] API backend - Plano Terapêutico Singular (PTS) com metas
- [x] API backend - Evolução diária com validações obrigatórias
- [x] API backend - Geração automática de evolução mensal (Motor de Inteligência)
- [x] API backend - Controle de presença e frequência
- [x] API backend - Checklist de auditoria/faturamento
- [x] Frontend - Layout do Dashboard com navegação completa
- [x] Frontend - Tela de cadastro de pacientes
- [x] Frontend - Tela de cadastro de profissionais
- [x] Frontend - Tela de gestão de guias/autorizações
- [x] Frontend - Tela de Plano Terapêutico Singular (PTS)
- [x] Frontend - Formulário de evolução diária estruturado
- [x] Frontend - Tela de evolução mensal automática
- [x] Frontend - Dashboard de auditoria (documentação incompleta)
- [x] Frontend - Controle de frequência/presença
- [x] Regra de blindagem - Campos obrigatórios para fechamento
- [x] Regra de blindagem - Verificação de duplicidade de atendimento
- [x] Regra de blindagem - Alerta de vencimento de guia
- [x] Regra de blindagem - Tempo mínimo de sessão
- [x] Testes unitários das APIs principais
- [x] Regra de blindagem - Bloqueio automático de edição após 24h no backend
- [x] Regra de blindagem - Validação CID vs procedimentos
- [x] Checklist de faturamento - Regras dinâmicas (sem hardcode)
- [x] Frontend - Registro de presença/falta com justificativa na tela de frequência

## Transformação SaaS Multi-tenant

- [x] Multi-tenancy - Tabela de clínicas (tenants) no banco de dados
- [x] Multi-tenancy - Adicionar tenantId em todas as tabelas existentes
- [x] Multi-tenancy - Filtro automático de dados por tenant em todas as queries
- [x] Sistema de papéis - Admin Plataforma (super admin), Admin Clínica, Terapeuta, Recepcionista
- [x] Sistema de papéis - Middleware de permissões por papel
- [x] Integração Stripe - Configuração de planos de assinatura mensal
- [x] Integração Stripe - Checkout e portal de gerenciamento de assinatura
- [x] Integração Stripe - Webhooks para controle de status de assinatura
- [x] Painel SaaS Admin - Gestão de clínicas cadastradas (super admin)
- [x] Painel SaaS Admin - Monitoramento de assinaturas e receita (super admin)
- [x] Painel SaaS Admin - Métricas de uso por clínica (super admin)
- [x] Landing Page - Página de vendas profissional
- [x] Landing Page - Seção de planos e preços
- [x] Landing Page - CTA de cadastro/trial
- [x] Logotipo profissional - Criar identidade visual do PEET
- [x] SEO - Meta tags, Open Graph, sitemap
- [x] Responsividade - Garantir funcionamento em mobile/tablet/desktop

## Correções de Bugs

- [x] Bug: Erro ao cadastrar paciente - campo diagnosis exige min 5 caracteres, mensagem em inglês
- [x] Melhorar validações do formulário de pacientes com mensagens em português
- [x] Bug: Opção de cadastrar sumiu do painel - corrigido roteamento no App.tsx
- [x] Bug: Usuário não consegue vincular clínica - fluxo de onboarding/criação de clínica corrigido
- [x] Redirecionar owner para onboarding com formulário de criação de clínica no primeiro login
- [x] Redirecionar para onboarding quando usuário não tem clínica vinculada
- [x] Bug CRÍTICO: Evolução diária não carrega planos terapêuticos - corrigido Select value="" em vez de 0
- [x] Corrigir todos os erros bloqueantes no fluxo completo (guia → plano → evolução)
- [x] Adicionar modalidades TO-IS (Integração Sensorial) e TO-AVDs (Atividades de Vida Diária)
- [x] Suporte a paciente particular (sem guia de autorização, com controle de pagamento)
- [x] Evolução diária funciona tanto para operadora quanto para particular
- [x] Corrigir AuthorizationForm e TherapeuticPlanForm Select value bugs
- [x] Bug: Select de Plano Terapêutico no formulário de Evolução Diária não mostrava opções - corrigido dados de teste e melhorada UX
- [x] TherapeuticPlanForm reescrito com melhor UX: dica informativa sobre PTS, placeholders claros, exemplos de títulos, categorias de metas via Select, data início automática
- [x] Dados de teste corrigidos no banco: títulos de planos atualizados de "PARTICULAR" para títulos descritivos

## Pendências Futuras

- [x] Exportação de relatórios em PDF (evolução mensal + checklist de faturamento)
- [x] Máscaras nos campos CPF (000.000.000-00), CNPJ e telefone
- [x] Controle de acesso mais granular por perfil de usuário
- [x] Restrição de edição/exclusão: apenas o usuário que cadastrou pode editar/excluir

## Redesign Visual Completo - Layout Profissional TEA

- [x] Novo design system: paleta de cores TEA (azul-peça, teal, gradientes suaves)
- [x] Tipografia profissional com Google Fonts (Inter/Plus Jakarta Sans)
- [x] Tema global claro com variáveis CSS otimizadas (paleta TEA)
- [x] Redesign DashboardLayout: sidebar moderna com ícones, animações, colapsável
- [x] Redesign Dashboard: cards com gradientes, métricas TEA, gráficos visuais
- [x] Redesign listagens: tabelas com busca debounce, filtros e paginação server-side
- [x] Redesign formulários: campos agrupados, validação visual, UX fluida
- [x] Redesign Evolução Diária: formulário otimizado para velocidade do terapeuta
- [x] Redesign Evolução Mensal e Frequência: visualização clara e exportável
- [x] Performance: paginação server-side para pacientes com contagem total
- [x] Performance: lazy loading de rotas com React.lazy + Suspense
- [x] Responsividade: layout adaptável para tablet e mobile (iOS/Android)
- [x] Micro-interações: transições suaves, loading skeletons, feedback visual
