import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { db } from '@/data/db/db'
import { shortcutRepo } from '@/data/repositories'
import type { WidgetInstance } from '@/types/domain'
import { BookmarksWidget } from './BookmarksWidget'

const stubInstance: WidgetInstance = {
  id: 'w-1',
  type: 'bookmarks',
  size: 'small',
  settings: {},
  createdAt: 0,
  updatedAt: 0,
}

async function resetDb() {
  await db.delete()
  await db.open()
}

async function seedLinks(labels: string[]) {
  for (const label of labels) {
    await shortcutRepo.createShortcut({ label, url: `https://${label.toLowerCase()}.com` })
  }
}

describe('BookmarksWidget', () => {
  beforeEach(resetDb)

  it('shows rows from the shared shortcut store', async () => {
    await seedLinks(['GitHub', 'Wikipedia', 'MDN'])
    render(<BookmarksWidget instance={stubInstance} />)

    expect(await screen.findByRole('button', { name: 'Open GitHub' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open Wikipedia' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open MDN' })).toBeInTheDocument()
  })

  it('shows an empty state when there are no shortcuts', async () => {
    render(<BookmarksWidget instance={stubInstance} />)
    expect(await screen.findByText('No links yet')).toBeInTheDocument()
  })

  it('caps the visible list and reports the real total', async () => {
    await seedLinks(['Bravo', 'Alpha', 'Delta', 'Charlie', 'Foxtrot', 'Echo', 'Hotel', 'Golf'])
    render(<BookmarksWidget instance={stubInstance} />)

    await screen.findByText('8 total')
    const openButtons = screen
      .getAllByRole('button')
      .filter((b) => (b.getAttribute('aria-label') ?? '').startsWith('Open '))
    expect(openButtons).toHaveLength(6)
    // Alphabetical: Alpha, Bravo, Charlie, Delta, Echo, Foxtrot (no Golf/Hotel).
    expect(screen.queryByRole('button', { name: 'Open Golf' })).not.toBeInTheDocument()
  })
})
