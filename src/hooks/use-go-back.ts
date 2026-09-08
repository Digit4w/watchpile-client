import { useRouter } from '@tanstack/react-router'

/**
 * Voltar pra onde a pessoa estava — e, quando não havia um "antes", pra onde
 * ela teria vindo.
 *
 * **O histórico é a resposta certa e não pode ser a única.** Uma tela de
 * detalhe se alcança por link direto, por recarregar a página e por abrir em
 * aba nova; nesses casos `history.back()` tira a pessoa do app, o que é pior
 * que não ter botão nenhum. `canGoBack()` separa os dois casos, e o destino de
 * origem é quem chama que decide — `/search` na tela do provedor, `/library` na
 * tela da obra.
 *
 * A checagem roda no CLIQUE, não no render: ela não é reativa, e ler durante o
 * render guardaria uma resposta que envelhece na primeira navegação seguinte.
 *
 * O fallback é uma função e não um caminho: `navigate` é tipado sobre a árvore
 * de rotas, e passar `string` por aqui trocaria essa checagem por um `as`.
 */
export function useGoBack(fallback: () => void): () => void {
  const router = useRouter()

  return () => {
    if (router.history.canGoBack()) {
      router.history.back()
      return
    }
    fallback()
  }
}
