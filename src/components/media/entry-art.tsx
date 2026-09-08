import type { Entry } from '@/domain/media'
import { RemoteArt } from './remote-art'

type EntryArtProps = {
  entry: Entry
  className?: string
}

/**
 * Arte da obra — **arte ADQUIRIDA**, servida do cache em disco do servidor
 * (brief, 3.10). O endereço vem pronto em `entry.art`, e é nulo quando não há
 * de onde tirar: obra digitada à mão não tem vínculo com provedor nenhum.
 *
 * O nulo cai no ladrilho da inicial, que é o mesmo tratamento que
 * `design/mockups/home.html` dava ao card sem pôster — e continua sendo a
 * resposta certa, porque um ícone genérico repetido na grade inteira seria
 * ruído e não informação.
 *
 * **O cliente não monta o endereço.** Ele chega pronto do servidor, como no
 * resultado de busca: montá-lo aqui seria o `if (slug === 'tmdb')` que o brief
 * recusa, e aqui seria pior — o cliente passaria a saber que existe cache.
 *
 * **Não define o próprio tamanho.** Quem chama decide a caixa — miniatura de
 * lista (`w-9 aspect-poster`) e carta inteira (`absolute inset-0`) são formas
 * diferentes do mesmo elemento, e embutir `aspect-poster` aqui obrigaria a
 * carta a desfazê-lo.
 */
export function EntryArt({ entry, className }: EntryArtProps) {
  return <RemoteArt src={entry.art} title={entry.title} className={className} />
}

/**
 * O mesmo tratamento, a partir de um título solto.
 *
 * Existe porque o mosaico 2×2 do ladrilho de pilha desenha as MESMAS peças
 * (`components/piles/pile-art.tsx`) e só recebe título — o servidor manda a
 * prévia enxuta, não obras inteiras. Duplicar o degradê nos dois lugares seria
 * garantir que um dia divergissem.
 */
export function ArtTile({
  title,
  className,
}: {
  title: string
  className?: string
}) {
  return (
    <div
      className={`flex items-center justify-center overflow-hidden bg-gradient-to-br from-raised to-line font-medium text-faint ${className ?? ''}`}
      aria-hidden="true"
    >
      {title.slice(0, 1).toUpperCase()}
    </div>
  )
}
