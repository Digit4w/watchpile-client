import { createFileRoute } from '@tanstack/react-router'
import { SessionPending } from '@/components/chrome/session-pending'
import { SettingsShell } from '@/components/chrome/settings-shell'
import { MediaTypesSection } from '@/components/settings/media-types-section'
import { useRequireSession } from '@/hooks/use-require-session'
import { settingsCopy } from './-settings.copy'

export const Route = createFileRoute('/settings/media-types')({
  component: SettingsMediaTypesRoute,
})

function SettingsMediaTypesRoute() {
  const user = useRequireSession()

  if (!user) {
    return <SessionPending />
  }

  return (
    <SettingsShell
      isAdmin={user.isAdmin}
      sectionTitle={settingsCopy.sections.mediaTypes}
    >
      <MediaTypesSection isAdmin={user.isAdmin} />
    </SettingsShell>
  )
}
