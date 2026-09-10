import { useNavigate } from '@tanstack/react-router'
import { Plus, Shapes } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { MediaTypeInfo } from '@/domain/media-type'
import { useMediaTypes } from '@/hooks/queries/media-types/use-media-types'
import { useDelayedPending } from '@/hooks/use-delayed-pending'
import { settingsCopy } from '@/routes/-settings.copy'
import {
  MediaTypeList,
  MediaTypeListSkeleton,
  MediaTypesEmpty,
  MediaTypesError,
  MediaTypesForbidden,
} from './media-type-list'
import { MediaTypeSheet, type SheetTarget } from './media-type-sheet'
import { SectionHeader } from './section-header'
import { TemplatePicker } from './template-picker'

/**
 * `THIS INSTANCE / Media types` — o vocabulário desta instalação.
 *
 * **Ler a lista é de todo mundo; escrever é do admin** (brief, 3.9). A recusa
 * que esta tela mostra ao não-admin é sobre a SEÇÃO, não sobre a consulta: ele
 * consegue ler os tipos — é disso que vivem os chips de `/library` e o selo da
 * carta —, e o que ele não faz é definir o vocabulário do servidor.
 *
 * Por isso a recusa é decidida por `isAdmin` e não por um 403 da consulta:
 * pedir a lista pra receber uma negativa que não vem seria esperar por uma
 * resposta que já se tem.
 *
 * **A ordem em que os estados são testados é decisão de design** (design
 * system, seção 8, quarta leva): resposta definitiva não fica atrás de espera.
 * A recusa vem antes de tudo porque ela não depende de requisição nenhuma; o
 * erro vem antes do esqueleto porque quem já falhou não está mais esperando.
 *
 * **Criar tem dois passos, e o primeiro é a escolha de template** — onde o
 * produto embarca conjunto pronto, criar mostra o conjunto primeiro (design
 * system, seção 5; brief, 3.9). Nenhum dos dois vai pra URL: formulário meio
 * preenchido não é estado que se manda pra alguém.
 */
export function MediaTypesSection({ isAdmin }: { isAdmin: boolean }) {
  const navigate = useNavigate()
  const types = useMediaTypes()
  const isLoading = useDelayedPending(types.isPending)

  const [choosingTemplate, setChoosingTemplate] = useState(false)
  const [sheet, setSheet] = useState<SheetTarget | null>(null)
  /**
   * Quantas vezes a folha de CRIAÇÃO abriu. É o que distingue dois formulários
   * em branco, que por conteúdo são idênticos — sem ele, escolher outro template
   * depois de já ter escolhido um deixaria os campos do primeiro na tela.
   */
  const [opens, setOpens] = useState(0)

  if (!isAdmin) {
    return <MediaTypesForbidden onBack={() => navigate({ to: '/settings' })} />
  }

  const list = types.data ?? []

  function edit(type: MediaTypeInfo) {
    setSheet({ mode: 'edit', type })
  }

  function fromTemplate(
    draft: Omit<Extract<SheetTarget, { mode: 'create' }>, 'mode'>,
  ) {
    setChoosingTemplate(false)
    setOpens((n) => n + 1)
    setSheet({ mode: 'create', ...draft })
  }

  function blank() {
    setChoosingTemplate(false)
    setOpens((n) => n + 1)
    setSheet({
      mode: 'create',
      icon: null,
      countsProgress: true,
      // Desligado, como a coluna: a maioria dos tipos não registra tempo.
      tracksTime: false,
      names: {},
    })
  }

  return (
    <>
      <SectionHeader
        title={settingsCopy.sections.mediaTypes}
        body={settingsCopy.mediaTypes.body}
        Icon={Shapes}
        action={
          <Button
            className="shrink-0"
            onClick={() => setChoosingTemplate(true)}
          >
            <Plus size={14} strokeWidth={2} aria-hidden="true" />
            <span>{settingsCopy.mediaTypes.add}</span>
          </Button>
        }
      />

      {types.isError && (
        <MediaTypesError error={types.error} onRetry={() => types.refetch()} />
      )}

      {!types.isError && isLoading && <MediaTypeListSkeleton />}

      {types.isSuccess && list.length === 0 && (
        <MediaTypesEmpty onAdd={() => setChoosingTemplate(true)} />
      )}

      {types.isSuccess && list.length > 0 && (
        <MediaTypeList types={list} onOpen={edit} />
      )}

      <TemplatePicker
        open={choosingTemplate}
        onOpenChange={setChoosingTemplate}
        onPick={fromTemplate}
        onScratch={blank}
      />

      {/* A folha edita o type que está no CACHE, não a cópia congelada de
       * quando ela abriu: sem isto, salvar deixaria a contagem de obras
       * desatualizada até fechar — e é ela que decide se apagar é oferecido. */}
      <MediaTypeSheet
        formKey={
          sheet?.mode === 'edit' ? `edit:${sheet.type.slug}` : `create:${opens}`
        }
        target={
          sheet?.mode === 'edit'
            ? {
                mode: 'edit',
                type:
                  list.find(({ slug }) => slug === sheet.type.slug) ??
                  sheet.type,
              }
            : sheet
        }
        onOpenChange={(open) => {
          if (!open) {
            setSheet(null)
          }
        }}
      />
    </>
  )
}
