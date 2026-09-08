import { createFileRoute } from '@tanstack/react-router'
import { SessionPending } from '@/components/chrome/session-pending'
import { SettingsShell } from '@/components/chrome/settings-shell'
import { PreferencesSection } from '@/components/settings/preferences-section'
import { useRequireSession } from '@/hooks/use-require-session'
import { settingsCopy } from './-settings.copy'

export const Route = createFileRoute('/settings/preferences')({
  component: SettingsPreferencesRoute,
})

function SettingsPreferencesRoute() {
  const user = useRequireSession()

  if (!user) {
    return <SessionPending />
  }

  return (
    <SettingsShell
      isAdmin={user.isAdmin}
      sectionTitle={settingsCopy.sections.preferences}
    >
      <PreferencesSection />
    </SettingsShell>
  )
}
