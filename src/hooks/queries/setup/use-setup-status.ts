import { useQuery } from '@tanstack/react-query'
import { setupService } from '@/services/setup'

export const setupKeys = {
  status: () => ['setup', 'status'] as const,
}

/**
 * O que a instalação ainda precisa. Lida pelo portão do `__root`, então roda em
 * toda tela — e é por isso que ela não revalida a cada foco de janela: a
 * resposta só muda por um ato desta mesma aba (criar o admin, concluir o
 * wizard), e quem faz esses atos invalida a chave.
 */
export function useSetupStatus() {
  return useQuery({
    queryKey: setupKeys.status(),
    queryFn: setupService.getStatus,
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
  })
}
