import { useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import type { AuthUser } from '@/domain/auth'
import { useCurrentUser } from '@/hooks/queries/auth/use-current-user'

/**
 * A sessão de quem está na tela, ou `null` enquanto ela não existe.
 *
 * O bloco que isto substitui estava escrito à mão em toda rota — a consulta, o
 * `useEffect` que manda pro login e o `if` que segura o render. Com quatro
 * rotas de Settings nascendo de uma vez, a quinta cópia foi a que pagou o
 * hook.
 *
 * **Desde 04/09/2026 não há mais cópia à mão em rota nenhuma.** As quatro
 * antigas — `/`, `/library`, `/piles` e `/piles/:id` — migraram num `refactor`
 * próprio, separado de qualquer tela nova, porque mexer nas quatro dentro do PR
 * de uma feature faria um diff que ninguém revisa.
 *
 * **Isso não traz o portão de primeiro uso pra cá**, e o argumento mudou de
 * lado: ele morava no `__root` porque essas quatro ficariam de fora, e agora
 * mora lá por um motivo melhor — `/login` e `/setup` de propósito NÃO exigem
 * sessão, e a pergunta que o portão faz é sobre a INSTALAÇÃO, não sobre quem
 * está olhando. Um hook de sessão nunca seria o lugar dela.
 *
 * `null` cobre dois estados de propósito — "ainda não sei" e "não tem sessão".
 * Quem chama trata os dois igual, porque a resposta na tela é a mesma: não
 * renderizar a seção. Separá-los só serviria pra escrever dois `return` que
 * devolvem o mesmo componente.
 */
export function useRequireSession(): AuthUser | null {
  const navigate = useNavigate()
  const currentUser = useCurrentUser()

  useEffect(() => {
    if (!currentUser.isPending && !currentUser.data) {
      navigate({ to: '/login' })
    }
  }, [currentUser.isPending, currentUser.data, navigate])

  return currentUser.data ?? null
}
