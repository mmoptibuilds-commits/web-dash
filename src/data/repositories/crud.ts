import type { Table, UpdateSpec } from 'dexie'

/**
 * Tiny CRUD helper over a Dexie table. Repositories compose these helpers so
 * data access stays in src/data/repositories and components never touch
 * tables directly.
 */

export interface CrudApi<T extends { id: string }> {
  list(): Promise<T[]>
  get(id: string): Promise<T | undefined>
  put(row: T): Promise<string>
  update(id: string, changes: Partial<T>): Promise<number>
  remove(id: string): Promise<void>
}

export function makeCrud<T extends { id: string }>(table: Table<T, string>): CrudApi<T> {
  return {
    list: () => table.toArray(),
    get: (id) => table.get(id),
    put: (row) => table.put(row).then(() => row.id),
    update: (id, changes) => table.update(id, changes as UpdateSpec<T>),
    remove: (id) => table.delete(id),
  }
}
