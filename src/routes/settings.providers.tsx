import { createFileRoute } from '@tanstack/react-router'
import { SessionPending } from '@/components/chrome/session-pending'
import { SettingsShell } from '@/components/chrome/settings-shell'
import { ProvidersSection } from '@/components/settings/providers-section'
import { useRequireSession } from '@/hooks/use-require-session'
import { settingsCopy } from './-settings.copy'

export const Route = createFileRoute('/settings/providers')({
  component: SettingsProvidersRoute,
})

function SettingsProvidersRoute() {
  const user = useRequireSession()

  if (!user) {
    return <SessionPending />
  }

  return (
    <SettingsShell
      isAdmin={user.isAdmin}
      sectionTitle={settingsCopy.sections.providers}
    >
      <ProvidersSection isAdmin={user.isAdmin} />
    </SettingsShell>
  )
}
