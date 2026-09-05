import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { db } from '@/data/db/db'
import { CalculatorMiniApp } from './CalculatorMiniApp'

async function resetDb() {
  await db.delete()
  await db.open()
}

describe('CalculatorMiniApp', () => {
  beforeEach(resetDb)

  it('defaults to the Basic tab and solves arithmetic', async () => {
    const user = userEvent.setup()
    render(<CalculatorMiniApp />)

    expect(screen.getByRole('button', { name: 'Basic' })).toHaveAttribute('aria-pressed', 'true')
    const display = screen.getByTestId('calc-display')
    expect(display).toHaveTextContent('0')

    await user.click(screen.getByRole('button', { name: '5' }))
    await user.click(screen.getByRole('button', { name: 'Multiply' }))
    await user.click(screen.getByRole('button', { name: '3' }))
    await user.click(screen.getByRole('button', { name: 'Equals' }))
    expect(display).toHaveTextContent('15')
  })

  it('keeps the calculation when switching tabs and back', async () => {
    const user = userEvent.setup()
    render(<CalculatorMiniApp />)

    const display = screen.getByTestId('calc-display')
    await user.click(screen.getByRole('button', { name: '6' }))
    await user.click(screen.getByRole('button', { name: 'Add' }))
    await user.click(screen.getByRole('button', { name: '7' }))
    await user.click(screen.getByRole('button', { name: 'Equals' }))
    expect(display).toHaveTextContent('13')

    await user.click(screen.getByRole('button', { name: 'Dates' }))
    expect(screen.getByLabelText('Birth date')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Basic' }))
    expect(screen.getByTestId('calc-display')).toHaveTextContent('13')
  })

  it('shows the age breakdown once a birth date is picked', () => {
    render(<CalculatorMiniApp />)
    const datesTab = screen.getByRole('button', { name: 'Dates' })
    fireEvent.click(datesTab)

    fireEvent.change(screen.getByLabelText('Birth date'), {
      target: { value: '2000-05-10' },
    })
    expect(screen.getByText(/total days/)).toBeInTheDocument()
  })

  it('converts a default pair once offline rates load', async () => {
    const user = userEvent.setup()
    render(<CalculatorMiniApp />)
    await user.click(screen.getByRole('button', { name: 'Currency' }))

    // The rate row seeds on first read; wait for the loaded select list.
    const from = await screen.findByRole('combobox', { name: 'From currency' })
    expect(from).toBeInTheDocument()

    const amount = screen.getByLabelText('Amount')
    await user.type(amount, '100')

    expect(await screen.findByTestId('currency-output')).toHaveTextContent(/92/)
  })
})
