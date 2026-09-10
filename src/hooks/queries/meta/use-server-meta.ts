import { useQuery } from '@tanstack/react-query'
import { metaService } from '@/services/meta'

/**
 * O que o servidor diz sobre si mesmo.
 *
 * `staleTime: Infinity` — a versão não muda enquanto o processo vive, e um
 * processo novo é uma sessão nova do navegador. Refazer a consulta ao voltar
 * pro `About` gastaria uma ida à rede pra reafirmar um número que não teve como
 * mudar.
 */
export function useServerMeta() {
  return useQuery({
    queryKey: ['meta'],
    queryFn: () => metaService.get(),
    staleTime: Number.POSITIVE_INFINITY,
  })
}
