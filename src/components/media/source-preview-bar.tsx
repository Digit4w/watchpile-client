import { Button } from '@/components/ui/button'
import { titleDetailCopy } from '@/routes/-title-detail.copy'
import type { EntryLink } from '@/services/entries'

const copy = titleDetailCopy.sources

/**
 * A barra que decide, enquanto a PÁGINA mostra como ficaria.
 *
 * ── Por que a decisão saiu da coluna ────────────────────────────────────────
 * A primeira versão do preview era um par de cartões dentro da caixa de
 * `Sources`, na coluna de 200px: duas sinopses cortadas a 11px, sem arte e sem
 * seções. O dono apontou que não dava pra ver detalhe nenhum, e estava certo —
 * **o preview de uma tela é a tela**. O que a troca de fonte muda é arte,
 * sinopse, formato, vínculos e a lista de episódios inteira, e nenhuma dessas
 * coisas cabe numa caixa da coluna.
 *
 * Então a página renderiza a obra como ela ficaria — `TitleDetail` é o mesmo
 * molde de `/search/:provider/:id`, que já sabe desenhar "esta obra vista por
 * um provedor" — e a decisão vira esta barra. Nenhuma segunda renderização em
 * miniatura: duas medidas do mesmo objeto é como uma fica pra trás.
 *
 * ── O que ela diz, e o que ela NÃO precisa dizer ────────────────────────────
 * "Nothing you tracked changes" fica aqui porque a coluna esquerda continua na
 * tela ao lado, com progresso, status, nota e pilhas intactos — a frase
 * confirma o que os olhos já veem, em vez de pedir que se acredite nela.
 *
 * Comparar é `Cancel`: a página de onde a pessoa veio é o "antes", e voltar a
 * ela é um clique. Um alternador aqui seria um terceiro controle pra uma
 * comparação que a navegação já faz.
 *
 * A casca é a mesma da barra flutuante da Home (`layout-toolbar.tsx`): vidro,
 * `sticky bottom-6`, e `pointer-events-none` na faixa pra ela não roubar o
 * clique do conteúdo que está prevendo.
 */
export function SourcePreviewBar({
  target,
  isLoading,
  failed,
  saving,
  onCancel,
  onConfirm,
}: {
  target: EntryLink
  isLoading: boolean
  failed: boolean
  saving: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="pointer-events-none sticky bottom-6 z-20 mt-auto flex justify-center pt-6">
      <div className="pointer-events-auto flex items-center gap-3 rounded-lg border border-line bg-glass px-3 py-2 shadow-lg backdrop-blur">
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium text-ink text-sm">
            {copy.previewing(target.provider.name)}
          </span>
          <span className="truncate text-faint text-xs">
            {isLoading
              ? copy.previewLoading
              : failed
                ? copy.previewFailed
                : copy.previewKeeps}
          </span>
        </div>
        <span className="h-8 w-px shrink-0 bg-line/60" />
        <Button variant="ghost" size="sm" onClick={onCancel}>
          {copy.cancel}
        </Button>
        {/* Confirmar continua habilitado quando o preview falha: a escolha é
         * sobre de onde a obra fala, não sobre o provedor estar de pé neste
         * segundo — travar puniria quem quer trocar por uma indisponibilidade
         * de terceiro. */}
        <Button size="sm" disabled={saving} onClick={onConfirm}>
          {copy.makeConfirm}
        </Button>
      </div>
    </div>
  )
}
