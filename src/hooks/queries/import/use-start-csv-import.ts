import { useMutation, useQueryClient } from '@tanstack/react-query'
import { importKeys } from '@/hooks/queries/import/keys'
import { notificationKeys } from '@/hooks/queries/notifications/keys'
import {
  type ImportJob,
  type ImportMode,
  type ImportSourceSlug,
  importService,
} from '@/services/import'

/**
 * Começar uma importação de CSV.
 *
 * **A resposta 202 é escrita no cache na hora**, sem esperar o poll: ela é o
 * job recém-criado, e é ela que troca o formulário pelo cartão de "rodando".
 * Invalidar e esperar o refetch deixaria a tela parada no formulário por um
 * ciclo de rede depois de a pessoa ter clicado — o app pareceria não ter ouvido.
 */
export function useStartCsvImport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ file, mode }: { file: File; mode: ImportMode }) =>
      importService.startCsv(file, mode),
    onSuccess: (job: ImportJob) => {
      /**
       * **Mescla, não substitui.** A resposta traz o job; `sources` continua
       * sendo do estado anterior, e escrevê-lo fora apagaria a lista de fontes
       * — a tela ficaria sem nenhuma caixa até o próximo poll.
       */
      queryClient.setQueryData(importKeys.status(), (old: unknown) => ({
        ...(old as object),
        running: job,
        mine: true,
        latest: job,
      }))
    },
  })
}

/**
 * Começar uma importação por nome de usuário.
 *
 * Mesmo `onSuccess` do CSV, e pelo mesmo motivo: o 202 é o job recém-criado, e é
 * ele que troca o formulário pelo cartão de "rodando" sem esperar um ciclo de
 * poll.
 */
export function useStartProfileImport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      source,
      username,
      mode,
    }: {
      source: Extract<ImportSourceSlug, 'anilist' | 'mal'>
      username: string
      mode: ImportMode
    }) => importService.startProfile(source, username, mode),
    onSuccess: (job: ImportJob) => {
      queryClient.setQueryData(importKeys.status(), (old: unknown) => ({
        ...(old as object),
        running: job,
        mine: true,
        latest: job,
      }))
    },
  })
}

/**
 * O fim de uma importação MEXE na biblioteca e no sino, então as duas precisam
 * ser esquecidas — mas só quando ele termina, não quando começa.
 *
 * Fica separado porque quem repara no fim é o poll, não a mutação: a rota
 * responde 202 e sai, e nesse instante nada entrou ainda.
 */
export function useInvalidateAfterImport() {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: ['entries'] })
    queryClient.invalidateQueries({ queryKey: notificationKeys.all })
  }
}
