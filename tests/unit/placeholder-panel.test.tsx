import { render, screen } from '@testing-library/react'
import { PlaceholderPanel } from '../../src/components/Panels/PlaceholderPanel'

describe('PlaceholderPanel', () => {
  it('renders the title text', () => {
    render(<PlaceholderPanel title="FINANCIAL" id="financial" />)
    expect(screen.getByText('FINANCIAL')).toBeInTheDocument()
  })

  it('renders "[ FEED OFFLINE ]" text', () => {
    render(<PlaceholderPanel title="NEWS" id="news" />)
    expect(screen.getByText('[ FEED OFFLINE ]')).toBeInTheDocument()
  })

  it('has the correct data-panel-id attribute', () => {
    const { container } = render(<PlaceholderPanel title="SIGNALS" id="signals" />)
    const panelDiv = container.querySelector('[data-panel-id="signals"]')
    expect(panelDiv).toBeInTheDocument()
  })
})
