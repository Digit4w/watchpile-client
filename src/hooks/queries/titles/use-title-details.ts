import { useQuery } from '@tanstack/react-query'
import type { HttpError } from '@/infra/lib/http-client'
import { type TitleDetails, titlesService } from '@/services/titles'
import { titleKeys } from './keys'

/**
 * Quantas vezes tentar de novo.
 *
 * **Zero**, e não é preguiça: as duas falhas que esta rota tem são 404 (o
 * provedor não tem, e não vai passar a ter) e 503 com motivo (falta chave,
 * estourou cota). Repetir gasta a cota que o 503 está justamente protegendo,
 * e a tela já sabe dizer o que fazer em cada caso.
 */
const SEM_RETRY = 0

/**
 * O contexto do provedor pra obra que já é sua.
 *
 * **404 aqui não é erro**: é obra digitada à mão, sem vínculo com provedor
 * nenhum (brief, 3.10). A tela continua desenhando tudo que já tem — título,
 * progresso, status, nota, pilhas — e só não mostra sinopse nem ano.
 */
export function useEntryTitleDetails(id: number) {
  return useQuery<TitleDetails, HttpError>({
    queryKey: titleKeys.ofEntry(id),
    queryFn: () => titlesService.ofEntry(id),
    retry: SEM_RETRY,
  })
}

/**
 * A obra do provedor, ao vivo.
 *
 * **O tipo entra na consulta mas NÃO na chave de cache**: ele já está implícito
 * no par (provedor, id externo) — o mesmo id não muda de tipo entre duas
 * visitas. Pôr na chave guardaria duas cópias do mesmo JSON.
 */
export function useProviderTitleDetails(
  provider: string,
  externalId: string,
  type: string,
  /**
   * Desligado, ele não pergunta nada — e o padrão é ligado porque a tela de
   * `/search/:provider/:id` sempre quer a resposta. Quem precisa do parâmetro é
   * o PREVIEW da tela de detalhe, que só pergunta enquanto a barra está aberta.
   */
  enabled = true,
) {
  return useQuery<TitleDetails, HttpError>({
    queryKey: titleKeys.ofProvider(provider, externalId),
    queryFn: () => titlesService.ofProvider(provider, externalId, type),
    enabled,
    retry: SEM_RETRY,
  })
}
