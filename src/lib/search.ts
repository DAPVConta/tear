// Remove caracteres reservados do PostgREST para impedir que o termo de busca
// quebre/reescreva a árvore de filtros do `.or()` (vírgula, parênteses, % etc.).
export function sanitizeSearch(term: string): string {
  return term.replace(/[,()%*:\\"]/g, " ").trim();
}
