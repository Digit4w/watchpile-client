import { useMutation, useQueryClient } from '@tanstack/react-query'
import { entryKeys } from '@/hooks/queries/entries/keys'
import { titleKeys } from '@/hooks/queries/titles/keys'
import type { HttpError } from '@/infra/lib/http-client'
import type { EntryLinkInput } from '@/services/entries'
import { type EntryLink, entriesService } from '@/services/entries'

/**
 * Vincular a obra que já existe a um provedor (brief, 3.10).
 *
 * **Invalida três frentes, e a terceira é a que se esquece.** Os vínculos
 * mudaram, óbvio; a OBRA mudou porque `art` é derivado do vínculo e uma obra
 * digitada à mão acabou de ganhar arte; e o CONTEXTO do provedor — sinopse,
 * ano, unidades, relações — passa a existir onde não existia, quando este é o
 * PRIMEIRO vínculo. Criar o segundo nunca troca a fonte: `sourceOf` fica com o
 * mais antigo até alguém promover outro, e é justamente esse invariante que faz
 * a troca silenciosa não existir.
 *
 * Aqui é invalidação e não remendo: pela régua de 30/08 esta escrita muda a
 * **composição** do que a tela mostra, não o conteúdo de um item dela.
 */
export function useLinkEntry(entryId: number) {
  const queryClient = useQueryClient()

  return useMutation<EntryLink, HttpError, EntryLinkInput>({
    mutationFn: (input) => entriesService.link(entryId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entryKeys.links(entryId) })
      queryClient.invalidateQueries({ queryKey: entryKeys.detail(entryId) })
      queryClient.invalidateQueries({ queryKey: titleKeys.ofEntry(entryId) })
    },
  })
}
