import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { db } from '@/data/db/db'
import { createShortcut } from '@/data/repositories/shortcuts'
import { AppLauncher } from './AppLauncher'

describe('AppLauncher', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  it('shows user links from the same shortcut repository as Home and Links', async () => {
    await createShortcut({ label: 'Example', url: 'https://example.com' })
    render(<AppLauncher />)
    expect(await screen.findByRole('heading', { name: 'Links' })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Open Example' })).toBeInTheDocument()
  })
})
