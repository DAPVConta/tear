// Parâmetros do controle de sessão. Centralizados aqui para que ajustar a
// política (ex.: exigência de operadora ou auditoria) seja uma linha só.

// Tempo sem interação até o logout automático.
export const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

// Antecedência do aviso "sua sessão vai encerrar" antes do logout.
export const IDLE_WARNING_MS = 60 * 1000;

// Frequência da verificação de ociosidade. Ler o relógio (em vez de confiar em
// um timer longo) faz a regra valer também quando a máquina dorme/hiberna. Um
// segundo mantém o contador do aviso fluido com um único timer.
export const IDLE_CHECK_INTERVAL_MS = 1000;

// Janela mínima entre duas marcações de atividade — evita atualizar estado a
// cada pixel de mousemove.
export const ACTIVITY_THROTTLE_MS = 5 * 1000;
