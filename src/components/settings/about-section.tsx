import { Info } from 'lucide-react'
import { settingsCopy } from '@/routes/-settings.copy'
import { SectionHeader, SettingsFact } from './section-header'

/**
 * `About` — fora dos dois grupos, no fim da coluna: versão e licença não são de
 * ninguém (design system, seção 5).
 *
 * **Não há número de versão aqui, e a ausência é honesta.** O `package.json`
 * dos dois repos está em `0.0.0` e o versionamento semântico segue em aberto
 * (`server/CLAUDE.md`, "Plano de distribuição"); mais que isso, a versão que
 * importa numa instalação self-hosted é a do SERVIDOR, e ele não publica
 * nenhuma rota que a diga. Mostrar a do cliente seria responder à pergunta
 * errada com um número que parece a resposta certa.
 *
 * Ela entra quando o servidor a servir — junto do ciclo que cortar release de
 * verdade.
 */
export function AboutSection() {
  return (
    <>
      <SectionHeader
        title={settingsCopy.sections.about}
        body={settingsCopy.about.body}
        Icon={Info}
      />

      <div className="flex flex-col">
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
