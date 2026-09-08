import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEntries } from '@/hooks/queries/entries/use-entries'
import { countOf } from '@/lib/format'
import { settingsCopy } from '@/routes/-settings.copy'
import { SectionHeader } from './section-header'

const copy = settingsCopy.export

/**
 * `YOU / Export` — a biblioteca num arquivo que este mesmo servidor lê.
 *
 * **Seção irmã de `Import`, e não uma caixa dentro dela** (decisão do dono,
 * 07/09/2026): *seção é destino e mora na URL* (design system, seção 5), e as
 * duas metades do laço são destinos diferentes.
 *
 * ── O download é um LINK, não um `fetch` ────────────────────────────────────
 * `<a href download>` e não uma mutação que monta um `Blob`: a resposta já vem
 * com `Content-Disposition`, então o navegador nomeia e salva o arquivo sem que
 * o app precise saber o nome dele. Um `fetch` traria o CSV inteiro pra memória
 * do JS só pra devolvê-lo ao disco, e obrigaria a tela a duplicar a regra do
 * nome do arquivo — que é do servidor, como o endereço da arte.
 *
 * Ele é mesma origem, então o cookie de sessão viaja com a navegação.
 */
export function ExportSection() {
  /**
   * A contagem é a MESMA consulta que `/library` usa, sem filtro — o cache é
   * compartilhado, então quem já passou pela biblioteca não paga nada aqui.
   * Contar por uma rota própria seria uma segunda conta da mesma coisa.
   */
  const entries = useEntries()
  const total = entries.data?.length ?? 0

  return (
    <>
      <SectionHeader
        title={settingsCopy.sections.export}
        body={copy.body}
        Icon={Upload}
      />

      <section className="flex flex-wrap items-start justify-between gap-4 py-3">
        <div className="min-w-0">
          <p className="font-medium text-ink text-sm">{copy.csv.title}</p>
          <p className="mt-1 max-w-prose text-muted text-sm">{copy.csv.body}</p>
          {/* O tamanho do que sai, antes do clique. Enquanto a contagem não
           * chegou, a linha não aparece — número que troca sozinho embaixo de
           * um botão parece defeito. */}
          {entries.isSuccess && (
            <p className="mt-1 text-faint text-xs">
              {total === 0
                ? copy.csv.empty
                : copy.csv.inLibrary(countOf(total, copy.csv.count))}
            </p>
          )}
        </div>

        {/*
         * `Button` com `asChild` para herdar a forma sem virar `<button>`: o
         * destino é um endereço, e destino escrito como botão perde abrir em
         * outra aba e copiar o link — a mesma régua do `ActionMenuLink`.
         */}
        <Button asChild variant="outline" className="shrink-0">
          <a href="/api/export/entries.csv" download>
            {copy.csv.action}
          </a>
        </Button>
      </section>
    </>
  )
}
