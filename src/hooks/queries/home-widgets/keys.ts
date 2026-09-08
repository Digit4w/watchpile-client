export const homeWidgetKeys = {
  all: ['home-widgets'] as const,
  entries: (id: number) => ['home-widgets', id, 'entries'] as const,
}
