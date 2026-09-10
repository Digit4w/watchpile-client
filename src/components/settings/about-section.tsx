import { Info } from 'lucide-react'
import { useServerMeta } from '@/hooks/queries/meta/use-server-meta'
import { settingsCopy } from '@/routes/-settings.copy'
import { SectionHeader, SettingsFact } from './section-header'

/**
 * `About` — fora dos dois grupos, no fim da coluna: versão e licença não são de
 * ninguém (design system, seção 5).
 *
 * **A versão entrou em 10/09/2026, e ela é a do SERVIDOR.** Esta seção passou
 * semanas sem número nenhum, e a ausência era honesta: o `package.json` do
 * cliente descreve o cliente, e numa instalação self-hosted quem define o que a
 * instalação é é o servidor — que até então não publicava rota que o dissesse.
 * Agora publica (`GET /api/meta`), e o número que aparece aqui é o mesmo que o
 * CI usa pra nomear a imagem e cortar a release.
 *
 * **Enquanto a resposta não chega, a linha mostra um traço, não some.** Uma das
 * três linhas aparecendo depois das outras faria a lista pular, e *peça que
 * entra sozinha se lê como defeito* tanto quanto a que sai. É a mesma conta do
 * mapa de fontes de `/search`, com a resposta oposta — lá o que estava em jogo
 * era um valor ERRADO por um quadro, aqui é só o compasso de espera de um valor
 * que ninguém consegue confundir com outro.
 */
export function AboutSection() {
  const meta = useServerMeta()

  return (
    <>
      <SectionHeader
        title={settingsCopy.sections.about}
        body={settingsCopy.about.body}
        Icon={Info}
      />

      <div className="flex flex-col">
        {/* **Nulo é resposta, não erro** — o servidor responde assim quando o
         * layout que o empacotou não trouxe o `package.json`. A linha fica e
         * diz que não sabe: sumir esconderia que a pergunta foi feita, e quem
         * abriu o `About` veio ler exatamente isto. */}
        <SettingsFact
          label={settingsCopy.about.version}
          value={
            meta.isSuccess
              ? (meta.data.version ?? settingsCopy.about.versionUnknown)
              : '—'
          }
          body={settingsCopy.about.versionBody}
        />
        <SettingsFact
          label={settingsCopy.about.license}
          value="AGPL-3.0"
          body={settingsCopy.about.licenseBody}
        />
        {/* A pergunta real de quem hospeda, e uma promessa do brief 3.1 — não
         * uma frase de marketing. */}
        <SettingsFact
          label={settingsCopy.about.storage}
          value="SQLite"
          body={settingsCopy.about.storageBody}
        />
      </div>
    </>
  )
}
