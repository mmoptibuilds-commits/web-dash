import 'fake-indexeddb/auto'
import { useState } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { db } from '@/data/db/db'
import { defaultSettings } from '@/data/defaults'
import { ControlCenterMenu } from './ControlCenter'

function Harness() {
  const [open, setOpen] = useState(false)
  return <><button type="button" onClick={() => setOpen(true)}>Open controls</button>{open ? <ControlCenterMenu onClose={() => setOpen(false)} /> : null}</>
}

describe('ControlCenterMenu', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
    await db.settings.put(defaultSettings())
  })

  it('closes with Escape, restores focus and omits dead Settings navigation', async () => {
    render(<Harness />)
    const opener = screen.getByRole('button', { name: 'Open controls' })
    opener.focus()
    fireEvent.click(opener)
    expect(await screen.findByRole('dialog', { name: 'Control Center' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /settings/i })).not.toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'Escape' })
    fireEvent.animationEnd(screen.getByRole('dialog', { name: 'Control Center' }))
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Control Center' })).not.toBeInTheDocument())
    expect(opener).toHaveFocus()
  })
})
