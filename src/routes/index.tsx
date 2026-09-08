import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { AppShell } from '@/components/chrome/app-shell'
import { SessionPending } from '@/components/chrome/session-pending'
import {
  HomeGrid,
  NEW_WIDGET_H,
  NEW_WIDGET_W,
} from '@/components/home/home-grid'
import { HomeStack } from '@/components/home/home-stack'
import { LayoutToolbar } from '@/components/home/layout-toolbar'
import { WidgetPicker } from '@/components/home/widget-picker'
import { Button } from '@/components/ui/button'
import type { WidgetType } from '@/domain/home-widget'
import { requestFailure } from '@/domain/request-failure'
import { useLogout } from '@/hooks/mutations/auth/use-logout'
import { useCreateWidget } from '@/hooks/mutations/home-widgets/use-create-widget'
import { useHomeWidgets } from '@/hooks/queries/home-widgets/use-home-widgets'
import { usePiles } from '@/hooks/queries/piles/use-piles'
import { useCompactViewport } from '@/hooks/use-compact-viewport'
import { useRequireSession } from '@/hooks/use-require-session'
import { appCopy } from '@/lib/copy'
import { homeCopy } from './-home.copy'

export const Route = createFileRoute('/')({
  component: HomeRoute,
})

function HomeRoute() {
  const navigate = useNavigate()
  const user = useRequireSession()
  const logout = useLogout()
  const widgets = useHomeWidgets()
  const piles = usePiles()
  const createWidget = useCreateWidget()
  const compact = useCompactViewport()
  const [editing, setEditing] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [dragging, setDragging] = useState<WidgetType | null>(null)

  if (!user) {
    return <SessionPending />
  }

  /**
   * Widget novo nasce sem pile: mostra a biblioteca inteira até o usuário
   * apontar uma fonte, em vez de nascer vazio esperando configuração.
   *
   * `y` é calculado, não `Infinity`: o layout atravessa JSON, onde `Infinity`
   * vira `null` e o servidor recusa.
   */
  function addWidget(type: WidgetType, at?: { x: number; y: number }) {
    const bottom = (widgets.data ?? []).reduce(
      (lowest, widget) => Math.max(lowest, widget.y + widget.h),
      0,
    )

    createWidget.mutate({
      type,
      filter: {},
      pileIds: [],
      itemCount: null,
      x: at?.x ?? 0,
      y: at?.y ?? bottom,
      w: NEW_WIDGET_W,
      h: NEW_WIDGET_H,
    })
  }

  /** Sair da edição fecha o painel junto: ele só existe dentro dela. */
  function toggleEditing() {
    setEditing((on) => {
      if (on) {
        setPickerOpen(false)
      }
      return !on
    })
  }

  return (
    <AppShell
      username={user.username}
      isAdmin={user.isAdmin}
      screenTitle={homeCopy.title}
      onLogOut={() =>
        logout.mutate(undefined, {
          onSuccess: () => navigate({ to: '/login' }),
        })
      }
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <h1 className="mb-6 font-semibold text-xl max-md:hidden">
          {homeCopy.title}
        </h1>

        {widgets.isPending && (
          <div className="grid gap-4 sm:grid-cols-2" aria-hidden="true">
            <div className="h-64 animate-pulse rounded-lg bg-card" />
            <div className="h-64 animate-pulse rounded-lg bg-card" />
          </div>
        )}

        {widgets.isError && (
          <div className="rounded-lg border border-danger/40 bg-card px-6 py-10 text-center">
            <h2 className="font-semibold text-base">
              {appCopy.error[requestFailure(widgets.error)].title}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-muted text-sm">
              {appCopy.error[requestFailure(widgets.error)].body}
            </p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => widgets.refetch()}
            >
              {appCopy.error.retry}
            </Button>
          </div>
        )}

        {widgets.data?.length === 0 && (
          <div className="rounded-lg border border-line border-dashed px-6 py-14 text-center">
            <h2 className="font-semibold text-base">{homeCopy.empty.title}</h2>
            <p className="mx-auto mt-2 max-w-md text-muted text-sm">
              {homeCopy.empty.body}
            </p>
            {/* O botão só existe onde o painel existe: no celular ele abriria
             * uma folha que a tela não comporta e um modo de edição que não
             * há como operar. */}
            {!compact && (
              <Button
                variant="default"
                className="mt-6"
                onClick={() => {
                  setEditing(true)
                  setPickerOpen(true)
                }}
              >
                {homeCopy.addWidget}
              </Button>
            )}
            {piles.data?.length === 0 && (
              <p className="mt-4 text-faint text-xs">
                {homeCopy.empty.noPiles}
              </p>
            )}
          </div>
        )}

        {/* Duas formas do mesmo conteúdo, e a escolha é de componente e não de
         * CSS: a grade do `react-grid-layout` não encolhe pra 330px de um
         * jeito operável no toque (`home-stack.tsx` explica). */}
        {widgets.data && widgets.data.length > 0 && compact && (
          <HomeStack widgets={widgets.data} />
        )}

        {widgets.data && widgets.data.length > 0 && !compact && (
          <HomeGrid
            widgets={widgets.data}
            editing={editing}
            dropping={dragging}
            onDrop={(at) => {
              if (dragging) {
                addWidget(dragging, at)
                setDragging(null)
              }
            }}
          />
        )}

        {/* Sem Edit Layout no celular: não há grade pra editar, e a barra
         * flutuante disputaria o mesmo canto da barra de abas. */}
        {!compact && (
          <LayoutToolbar
            editing={editing}
            pickerOpen={pickerOpen}
            onToggleEditing={toggleEditing}
            onTogglePicker={() => setPickerOpen((open) => !open)}
          />
        )}
      </div>

      <WidgetPicker
        open={!compact && editing && pickerOpen}
        busy={createWidget.isPending}
        onClose={() => setPickerOpen(false)}
        onPick={(type) => addWidget(type)}
        onDragType={setDragging}
      />
    </AppShell>
  )
}
