import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authService } from '@/services/auth'

/**
 * Sair, e **levar junto tudo que a sessão trouxe**.
 *
 * O `queryClient` é singleton de módulo (`infra/lib/query-client.ts`): ele
 * sobrevive à navegação e à troca de usuário. Zerar só `['auth','me']` dizia
 * "não há mais sessão" e deixava a biblioteca, as pilhas, as notificações e as
 * preferências da pessoa anterior no cache — que a próxima a entrar veria
 * pintadas na tela até cada consulta refazer sozinha. **É dado de uma conta
 * aparecendo na de outra**, e nenhum teste do servidor pega, porque o servidor
 * respondeu certo às duas.
 *
 * **`removeQueries()` e não `clear()`**: `clear()` esvazia também o cache de
 * MUTATIONS, e uma delas é esta, ainda liquidando dentro do próprio
 * `onSuccess`. O que precisa sumir aqui são as consultas.
 *
 * **A limpeza vale só aqui, e não no login.** A tentação é blindar os dois
 * lados, mas o cache do TanStack Query é de memória e não tem persistidor: ele
 * morre junto com a página. A única janela em que dado de outra conta
 * sobrevive é sair e entrar **sem recarregar**, que é exatamente esta. Limpar
 * no login de novo só acrescentaria uma piscada de esqueleto numa tela que já
 * está saindo.
 *
 * O `null` vai DEPOIS da limpeza, e é o que mantém a saída determinística: sem
 * ele a consulta de sessão renasce vazia, vai ao servidor e descobre pelo 401
 * o que esta linha já sabe.
 */
export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      queryClient.removeQueries()
      queryClient.setQueryData(['auth', 'me'], null)
    },
  })
}
