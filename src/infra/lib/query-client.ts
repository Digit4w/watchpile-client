import { QueryClient } from '@tanstack/react-query'
import { shouldRetry } from '@/domain/request-failure'

/**
 * O cliente de consulta do app.
 *
 * **Ele era `new QueryClient()` sem nada**, e isso não era decisão: eram os
 * padrões da biblioteca passando por escolha, do mesmo jeito que as três
 * opacidades de desabilitado eram cópia e não regra (04/09/2026). O que mais
 * custava era o `retry: 3` com backoff — com o servidor parado, toda tela
 * ficava alguns segundos no esqueleto antes de admitir que não ia dar, e o
 * único jeito de saber disso era olhar a aba de rede.
 *
 * Quando repetir é regra decidível, então mora em `domain/request-failure` com
 * teste. Aqui fica só a ligação.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: shouldRetry },
    /**
     * Já é o padrão da biblioteca, e está escrito porque a linha acima o
     * contradiz de propósito: consulta repetida devolve a mesma leitura, mas um
     * `POST` repetido pode criar a segunda obra — e progresso é log
     * append-only (brief, 3.11), onde um evento a mais não se desfaz sozinho.
     */
    mutations: { retry: false },
  },
})
