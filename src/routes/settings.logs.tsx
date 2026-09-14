import { createFileRoute } from '@tanstack/react-router'
import { SessionPending } from '@/components/chrome/session-pending'
import { SettingsShell } from '@/components/chrome/settings-shell'
import { LogsSection } from '@/components/settings/logs-section'
import { useRequireSession } from '@/hooks/use-require-session'
import { settingsCopy } from './-settings.copy'

export const Route = createFileRoute('/settings/logs')({
  component: SettingsLogsRoute,
})

function SettingsLogsRoute() {
  const user = useRequireSession()

  if (!user) {
    return <SessionPending />
  }

  // `fill`: a caixa de log ocupa a altura que sobra e só ela rola.
  return (
    <SettingsShell
      isAdmin={user.isAdmin}
      sectionTitle={settingsCopy.sections.logs}
      fill
    >
      <LogsSection />
    </SettingsShell>
  )
}
