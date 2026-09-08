import { useQuery } from '@tanstack/react-query'
import { notificationsService } from '@/services/notifications'
import { notificationKeys } from './keys'

/**
 * O contador do sino — quantos não lidos, e a pior severidade entre eles.
 *
 * **A severidade vem do servidor, não é recalculada aqui.** O contador é do
 * conjunto inteiro e a tela só tem a página que pediu; recalcular seria a
 * segunda conta da mesma coisa, e é sempre uma delas que fica pra trás (design
 * system, seção 8).
 *
 * `refetchInterval` porque a condição de instância nasce no servidor, não de um
 * gesto daqui: quem configura a chave do IGDB pode ser outro admin, noutra aba.
 * Um minuto é folgado de propósito — o servidor é um arquivo local, e a
 * pergunta não é urgente. **`refetchOnWindowFocus` é o que de fato responde
 * rápido**, porque o gesto real é voltar pro app depois de mexer em Settings.
 */
export function useUnreadNotifications(enabled = true) {
  return useQuery({
    queryKey: notificationKeys.unread(),
    queryFn: () => notificationsService.unreadCount(),
    enabled,
    refetchInterval: 1000 * 60,
    refetchOnWindowFocus: true,
    staleTime: 1000 * 30,
  })
}
