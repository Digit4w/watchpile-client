import type { LogLevelFilter } from '@/domain/log-view'

export const logKeys = {
  all: ['logs'] as const,
  page: (level: LogLevelFilter) => [...logKeys.all, level] as const,
}
