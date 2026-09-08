import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { db } from '@/data/db/db'
import { createShortcut, listShortcuts } from '@/data/repositories/shortcuts'
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

  it('creates, edits and deletes launcher shortcuts through the shared repository', async () => {
    const user = userEvent.setup()
    render(<AppLauncher />)

    await user.click(screen.getByRole('button', { name: 'Add shortcut' }))
    await user.type(screen.getByLabelText('Name'), 'Reference')
    await user.type(screen.getByLabelText('Web address'), 'example.com')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(await screen.findByRole('button', { name: 'Open Reference' })).toBeInTheDocument()
    await waitFor(async () => expect((await listShortcuts()).map((item) => item.label)).toEqual(['Reference']))

    await user.click(screen.getByRole('button', { name: 'Edit Reference' }))
    const name = screen.getByLabelText('Name')
    await user.clear(name)
    await user.type(name, 'Reference Hub')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByRole('button', { name: 'Open Reference Hub' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Delete Reference Hub' }))
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Open Reference Hub' })).not.toBeInTheDocument())
    expect(await listShortcuts()).toEqual([])
  })

  it('keeps focus inside a child shortcut dialog while the launcher is inert', async () => {
    const user = userEvent.setup()
    render(<AppLauncher />)

    await user.click(screen.getByRole('button', { name: 'Add shortcut' }))
    const name = screen.getByLabelText('Name')
    await waitFor(() => expect(name).toHaveFocus())
    expect(document.querySelector('[aria-label="Apps and links"]')).toHaveAttribute('inert')
  })
})
