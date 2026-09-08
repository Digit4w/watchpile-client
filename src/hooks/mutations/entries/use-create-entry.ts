import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Entry } from '@/domain/media'
import { entryKeys } from '@/hooks/queries/entries/keys'
import { homeWidgetKeys } from '@/hooks/queries/home-widgets/keys'
import { pileKeys } from '@/hooks/queries/piles/keys'
import { searchKeys } from '@/hooks/queries/search/keys'
import { titleKeys } from '@/hooks/queries/titles/keys'
import type { HttpError } from '@/infra/lib/http-client'
import { type EntryInput, entriesService } from '@/services/entries'

export function useCreateEntry() {
  const queryClient = useQueryClient()

  return useMutation<Entry, HttpError, EntryInput>({
    mutationFn: entriesService.create,
    onSuccess: (_created, sent) => {
      queryClient.invalidateQueries({ queryKey: entryKeys.all })
      // o que um widget resolve depende das entries; a chave dele mora à parte
      queryClient.invalidateQueries({ queryKey: homeWidgetKeys.all })

      /**
       * Nascer dentro de uma pilha muda a PILHA, não só a obra: `entryCount`,
       * o mosaico da prévia e o `updated_at` que ordena `/piles` são todos
       * derivados de `pile_entries`. Sem isto a grade de pilhas mostraria a
       * contagem antiga até que outra coisa a invalidasse.
       *
       * Só quando houve pilha: invalidar sempre faria toda obra digitada à mão
       * refazer uma listagem que não mudou.
       */
      if (sent.pileIds && sent.pileIds.length > 0) {
        queryClient.invalidateQueries({ queryKey: pileKeys.all })
      }

      /**
       * **A obra nasce, e as telas do PROVEDOR precisam saber que ela é sua.**
       *
       * `ownedEntryId` e a marca de "já está na sua biblioteca" são campos da
       * resposta do provedor, não da obra — e nenhuma das duas chaves era
       * tocada aqui. O efeito era o defeito visível: em
       * `/search/:provider/:id`, adicionar deixava o botão dizendo
       * `Add to library` como se nada tivesse acontecido, e clicar de novo
       * criava a segunda cópia.
       *
       * Só quando veio de um resultado: obra digitada à mão não tem id externo,
       * então nenhum resultado de busca muda de estado por causa dela — mesma
       * régua do `pileIds` acima.
       */
      if (sent.source) {
        queryClient.invalidateQueries({
          queryKey: titleKeys.ofProvider(
            sent.source.provider,
            sent.source.externalId,
          ),
        })
        // A busca invalida INTEIRA: a mesma obra pode estar em várias consultas
        // já cacheadas, e a chave delas é o termo digitado, não o id.
        queryClient.invalidateQueries({ queryKey: searchKeys.all })
      }
    },
  })
}
