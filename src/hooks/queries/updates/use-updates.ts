import { useQuery } from '@tanstack/react-query'
import { updatesService } from '@/services/updates'

export const updateKeys = { all: ['updates'] as const }

/**
 * O estado de atualização desta instalação.
 *
 * **Enquanto o download acontece, a consulta se repete** — é o mesmo desenho do
 * import: o servidor faz o trabalho em segundo plano e a tela acompanha lendo,
 * porque o progresso é dele e não da requisição. Fora disso não há intervalo:
 * release não sai de minuto em minuto, e quem quer conferir agora tem o botão.
 *
 * `staleTime` zero de propósito, ao contrário de `useServerMeta`: a versão do
 * processo não muda enquanto ele vive, mas o que se sabe sobre a de FORA muda a
 * cada consulta — inclusive por causa de um gesto na própria tela.
 */
export function useUpdates() {
  return useQuery({
    queryKey: updateKeys.all,
    queryFn: () => updatesService.get(),
    refetchInterval: (query) =>
      query.state.data?.download.state === 'downloading' ? 700 : false,
  })
}
