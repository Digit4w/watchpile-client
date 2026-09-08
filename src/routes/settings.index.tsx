import { createFileRoute } from '@tanstack/react-router'
import { SessionPending } from '@/components/chrome/session-pending'
import {
  SettingsIndex,
  SettingsShell,
} from '@/components/chrome/settings-shell'
import { AboutSection } from '@/components/settings/about-section'
import { AccountSection } from '@/components/settings/account-section'
import { MediaTypesSection } from '@/components/settings/media-types-section'
import { PreferencesSection } from '@/components/settings/preferences-section'
import { useRequireSession } from '@/hooks/use-require-session'
import { settingsCopy } from './-settings.copy'

export const Route = createFileRoute('/settings/')({
  component: SettingsIndexRoute,
})

/**
 * `/settings` sem seção — **o primeiro nível, não um redirecionamento** (design
 * system, seção 5).
 *
 * No celular ele é a lista de seções, que ali é uma tela de verdade; no
 * desktop, onde coluna e painel aparecem juntos, ele mostra a primeira seção
 * visível de quem abriu. A URL não muda nos dois casos, e é isso que faz o
 * voltar do navegador SAIR do modo em vez de pular entre seções.
 *
 * Quem escolhe o ramo é `SettingsIndex`; esta rota só diz o que cada destino
 * renderiza, porque a coluna e o painel precisam concordar sobre qual é a
 * primeira seção e essa conta mora num lugar só.
 */
function SettingsIndexRoute() {
  const user = useRequireSession()

  if (!user) {
    return <SessionPending />
  }

  return (
    <SettingsIndex
      isAdmin={user.isAdmin}
      renderSection={(to) => (
        <SettingsShell isAdmin={user.isAdmin} sectionTitle={settingsCopy.title}>
          {to === '/settings/account' && <AccountSection user={user} />}
          {to === '/settings/preferences' && <PreferencesSection />}
          {to === '/settings/media-types' && (
            <MediaTypesSection isAdmin={user.isAdmin} />
          )}
          {to === '/settings/about' && <AboutSection />}
        </SettingsShell>
      )}
    />
  )
}
