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
 *
 * ── A SEGUNDA fase também segura o poll — 13/09/2026 ────────────────────────
 * O aquecimento (buscar arte e snapshot do que entrou) é um job próprio, e ele
 * dura muito mais que o import: medido no servidor, 18,7 min no MyAnimeList e
 * 52 min no AniList para 1.200 obras. Ler só `running` pararia de perguntar
 * exatamente quando o contador da segunda fase começa a andar — e a tela
 * mostraria um número congelado, que é pior que não mostrar número nenhum.
 *
 * **O intervalo é MAIOR na segunda fase**, e a régua é a mesma que escolheu os
 * dois segundos: o passo em que o contador anda de forma legível. Ali cada
 * obra custa uma ida à rede com pausa, então ele avança de um em um a cada
 * meio segundo ou mais — perguntar de dois em dois segundos por quase uma hora
 * seria mil e oitocentas requisições para ver o mesmo número.
 */
export function useImportStatus() {
  return useQuery({
    queryKey: importKeys.status(),
    queryFn: () => importService.status(),
    refetchInterval: (query) => {
      const data = query.state.data
      if (data?.running) {
        return 2000
      }
      return data?.enriching ? 5000 : false
    },
    refetchOnWindowFocus: true,
  })
}
