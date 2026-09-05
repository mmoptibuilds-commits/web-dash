import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { WidgetInstance } from '@/types/domain'
import { CalculatorWidget } from './CalculatorWidget'

const stubInstance: WidgetInstance = {
  id: 'w-calc',
  type: 'calculator',
  size: 'large',
  settings: {},
  createdAt: 0,
  updatedAt: 0,
}

describe('CalculatorWidget', () => {
  it('solves quick sums on the tile', async () => {
    const user = userEvent.setup()
    render(<CalculatorWidget instance={stubInstance} />)

    const display = screen.getByTestId('calc-display')
    await user.click(screen.getByRole('button', { name: '7' }))
    await user.click(screen.getByRole('button', { name: 'Add' }))
    await user.click(screen.getByRole('button', { name: '5' }))
    await user.click(screen.getByRole('button', { name: 'Equals' }))
    expect(display).toHaveTextContent('12')
  })

  it('advertises the full app without navigating in edit mode', () => {
    render(<CalculatorWidget instance={stubInstance} editMode />)
    expect(
      screen.getByRole('button', { name: 'Open Calculator' }),
    ).toBeInTheDocument()
  })
})
