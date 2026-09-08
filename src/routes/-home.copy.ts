// Copy da Home. O que atravessa tela — chrome, carta de mídia, rótulo de enum
// do schema — mora em `@/lib/copy` (29/08/2026, quando `/library` chegou).
export const homeCopy = {
  picker: {
    title: 'Add widget',
    hint: 'Drag one onto your home, or click to drop it at the end.',
    hintTouch: 'Tap to add it at the end.',
    close: 'Close',
    sourceNote:
      'A widget with no pile shows your whole library. Pick a source after adding it.',
  },
  typeHints: {
    list: 'One line each, with progress',
    grid: 'Covers, several per row',
    scroll: 'A single row that slides',
    stats: 'Numbers about your library',
  },
  title: 'Home',
  editLayout: 'Edit layout',
  doneEditing: 'Done',
  addWidget: 'Add widget',
  empty: {
    title: 'Your home is empty',
    body: 'Pick a widget on the right and drop it here.',
    noPiles: "Don't have a pile yet? Create one first.",
  },
  widget: {
    remove: 'Remove widget',
    // A pergunta diz o que NÃO se perde: remover widget não apaga pile nem
    // obra, e sem essa frase a confirmação sugeriria que sim.
    removeTitle: 'Remove this widget?',
    removeBody: 'The pile and its titles stay. Only the widget goes away.',
    removeCancel: 'Cancel',
    removeConfirm: 'Remove',
    configure: 'Widget settings',
    drag: 'Drag to reorder',
    /**
     * A alça da LINHA de obra, que é outra coisa que `drag` — aquela move o
     * widget na grade, esta reordena as obras dentro dele. As palavras são as
     * mesmas de `/piles/:id` de propósito: é o mesmo gesto sobre o mesmo
     * objeto, e copy que diverge entre telas por causa do vizinho ensina duas
     * coisas onde há uma.
     */
    reorder: 'Drag to reorder',
    name: 'Name',
    namePlaceholder: 'Optional',
    type: 'Widget type',
    source: 'Source',
    wholeLibrary: 'Whole library',
    wholeLibraryHint:
      'No pile selected — shows everything, filters still apply.',
    filter: 'Filter',
    mediaType: 'Media type',
    status: 'Status',
    itemCount: 'Show at most',
    noLimit: 'No limit',
    emptyContent: 'Nothing matches this widget yet.',
    notBuilt: 'The stats widget has no fields decided yet (brief 3.15).',
  },
  types: {
    list: 'List',
    grid: 'Grid',
    scroll: 'Scroll',
    stats: 'Stats',
  },
}
