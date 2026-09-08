import { useQuery } from '@tanstack/react-query'
import { importService } from '@/services/import'
import { importKeys } from './keys'

/**
 * O estado do import (brief, 3.12).
 *
 * **O poll só existe ENQUANTO há job rodando**, e isso é o ponto: o intervalo
 * vem de uma função que lê a resposta anterior e devolve `false` quando nada
 * está em curso. Um intervalo fixo perguntaria a cada dois segundos, para
 * sempre, numa tela que a pessoa abre uma vez na vida da instalação (design
 * system, seção 5) — e o servidor dela é um Raspberry Pi.
 *
 * Dois segundos porque é o passo em que o contador ANDA de forma legível: o
 * executor escreve os contadores uma vez por lote de 200, e um lote leva
 * dezenas de milissegundos. Mais rápido não mostraria mais informação, só
 * gastaria requisição.
 *
 * **E o poll não é o único caminho de volta.** Quem termina de importar recebe
 * notificação, então quem saiu da tela fica sabendo pelo sino — que é o motivo
 * de o job rodar em segundo plano.
 */
export function useImportStatus() {
  return useQuery({
    queryKey: importKeys.status(),
    queryFn: () => importService.status(),
    refetchInterval: (query) => (query.state.data?.running ? 2000 : false),
    refetchOnWindowFocus: true,
  })
}
