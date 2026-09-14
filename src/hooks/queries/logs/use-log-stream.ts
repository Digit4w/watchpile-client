import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { LogLevelFilter, LogLine } from '@/domain/log-view'
import { logsService } from '@/services/logs'
import { logKeys } from './keys'

/** De quanto em quanto se pergunta por linha nova — o mesmo passo do import. */
export const FOLLOW_INTERVAL_MS = 2000

/**
 * As linhas de UM filtro: a página inicial, as mais antigas que se pediram e as
 * novas que chegaram — 14/09/2026.
 *
 * **A seção monta este hook com `key={level}`**, então trocar o filtro zera tudo
 * em vez de misturar linhas de dois recortes. É mais simples que reconciliar, e
 * é o comportamento certo: outro filtro é outra lista.
 *
 * **O que chega não reordena nada**: linha nova entra no FIM e mais antiga no
 * COMEÇO, e quem decide se a caixa acompanha é a tela, que sabe onde a rolagem
 * está. O hook só junta.
 *
 * `retry: false` pelo motivo de `useStorage`: a rota é de admin, e 403 é
 * resposta definitiva.
 */
export function useLogStream(level: LogLevelFilter) {
  const page = useQuery({
    queryKey: logKeys.page(level),
    queryFn: () => logsService.read({ level }),
    retry: false,
    // A página inicial não se refaz sozinha: quem traz o novo é o
    // acompanhamento, e refazê-la trocaria a lista sob a mão de quem lê.
    refetchOnWindowFocus: false,
    staleTime: Number.POSITIVE_INFINITY,
  })

  const [older, setOlder] = useState<LogLine[]>([])
  const [newer, setNewer] = useState<LogLine[]>([])
  const [olderExists, setOlderExists] = useState<boolean | null>(null)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [olderFailed, setOlderFailed] = useState(false)

  const base = page.data?.lines ?? []
  const lines = [...older, ...base, ...newer]
  const hasOlder = olderExists ?? page.data?.hasOlder ?? false

  // O último instante que a tela já tem — de onde o acompanhamento continua.
  const lastTime = lines.at(-1)?.time
  const lastTimeRef = useRef(lastTime)
  lastTimeRef.current = lastTime

  const ready = page.isSuccess
  useEffect(() => {
    if (!ready) {
      return
    }
    let inFlight = false
    const id = setInterval(async () => {
      if (inFlight) {
        return
      }
      inFlight = true
      try {
        // Sem nenhuma linha ainda, `after: 0` traz o que aparecer.
        const next = await logsService.read({
          level,
          after: lastTimeRef.current ?? 0,
        })
        if (next.lines.length > 0) {
          setNewer((current) => [...current, ...next.lines])
        }
      } catch {
        // Falhar uma rodada do acompanhamento não é estado de erro da tela: a
        // lista que está ali continua certa, e a rodada seguinte tenta de novo.
      } finally {
        inFlight = false
      }
    }, FOLLOW_INTERVAL_MS)
    return () => clearInterval(id)
  }, [ready, level])

  const firstTime = lines[0]?.time
  const loadOlder = useCallback(async () => {
    if (firstTime === undefined) {
      return
    }
    setLoadingOlder(true)
    setOlderFailed(false)
    try {
      const previous = await logsService.read({ level, before: firstTime })
      setOlder((current) => [...previous.lines, ...current])
      setOlderExists(previous.hasOlder)
    } catch {
      setOlderFailed(true)
    } finally {
      setLoadingOlder(false)
    }
  }, [level, firstTime])

  return {
    lines,
    usage: page.data?.usage ?? null,
    hasOlder,
    loadOlder,
    loadingOlder,
    olderFailed,
    /** Quantas linhas chegaram pelo acompanhamento — a tela conta as não vistas. */
    newerCount: newer.length,
    isPending: page.isPending,
    isError: page.isError,
    error: page.error,
    refetch: page.refetch,
  }
}
