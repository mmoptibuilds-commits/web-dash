import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitForElementToBeRemoved } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { db } from '@/data/db/db'
import { shortcutRepo } from '@/data/repositories'
import { BookmarksMiniApp } from './BookmarksMiniApp'

async function resetDb() {
  await db.delete()
  await db.open()
}

async function seedLink(label: string, url: string) {
  const res = await shortcutRepo.createShortcut({ label, url })
  if (!res.ok) throw new Error(res.reason)
}

describe('BookmarksMiniApp', () => {
  beforeEach(resetDb)
  afterEach(() => vi.restoreAllMocks())

  it('shows an empty state with no shortcuts', async () => {
    render(<BookmarksMiniApp />)
    expect(await screen.findByText('No links yet')).toBeInTheDocument()
  })

  it('adds a link inline and lists it', async () => {
    const user = userEvent.setup()
    render(<BookmarksMiniApp />)

    await user.click(await screen.findByRole('button', { name: 'Add link' }))
    await user.type(screen.getByLabelText('Label'), 'GitHub')
    await user.type(screen.getByLabelText('URL'), 'https://github.com')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(await screen.findByRole('button', { name: 'Open GitHub' })).toBeInTheDocument()
    expect(screen.getByText('github.com')).toBeInTheDocument()
  })

  it('shows the repo error and keeps the form open on an invalid URL', async () => {
    const user = userEvent.setup()
    render(<BookmarksMiniApp />)

    await user.click(await screen.findByRole('button', { name: 'Add link' }))
    await user.type(screen.getByLabelText('Label'), 'Bad')
    await user.type(screen.getByLabelText('URL'), 'javascript:alert(1)')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/only safe http/i)
    // Form is still open for correction and nothing was created.
    expect(screen.getByLabelText('URL')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Open Bad' })).not.toBeInTheDocument()
  })

  it('deletes a shortcut after an inline confirmation', async () => {
    const user = userEvent.setup()
    await seedLink('GitHub', 'https://github.com')
    // UI flow: confirm then call shortcutRepo.deleteShortcut. (The real repo
    // cascade is covered separately; here we delete the row so the live list
    // reflects the outcome without depending on a coordinator-owned schema.)
    const delSpy = vi
      .spyOn(shortcutRepo, 'deleteShortcut')
      .mockImplementation(async (id) => {
        await db.shortcuts.delete(id)
      })
    render(<BookmarksMiniApp />)

    const openBtn = await screen.findByRole('button', { name: 'Open GitHub' })
    expect(openBtn).toBeInTheDocument()

    // Cancelling leaves the row and does not call the repo.
    await user.click(screen.getByRole('button', { name: 'Delete GitHub' }))
    const dialog = await screen.findByRole('alertdialog')
    expect(dialog).toHaveTextContent(/It will disappear from Home pages/i)
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(delSpy).not.toHaveBeenCalled()

    // Confirm deletes it.
    await user.click(screen.getByRole('button', { name: 'Delete GitHub' }))
    await screen.findByRole('alertdialog')
    const removal = waitForElementToBeRemoved(() =>
      screen.queryByRole('button', { name: 'Open GitHub' }),
    )
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    await removal
    expect(delSpy).toHaveBeenCalledTimes(1)
    expect(await screen.findByText('No links yet')).toBeInTheDocument()
  })

  it('filters the list client-side over label and URL', async () => {
    const user = userEvent.setup()
    await seedLink('GitHub', 'https://github.com')
    await seedLink('Wikipedia', 'https://wikipedia.org')
    render(<BookmarksMiniApp />)

    await screen.findByRole('button', { name: 'Open GitHub' })

    await user.type(screen.getByLabelText('Search links'), 'wiki')
    expect(await screen.findByRole('button', { name: 'Open Wikipedia' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Open GitHub' })).not.toBeInTheDocument()

    await user.clear(screen.getByLabelText('Search links'))
    await user.type(screen.getByLabelText('Search links'), 'github.com')
    expect(await screen.findByRole('button', { name: 'Open GitHub' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Open Wikipedia' })).not.toBeInTheDocument()
  })
})
