export const preferenceKeys = {
  all: ['preferences'] as const,
  mediaTypes: () => [...preferenceKeys.all, 'media-types'] as const,
  searchSources: () => [...preferenceKeys.all, 'search-sources'] as const,
}
