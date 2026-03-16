import { render } from '@testing-library/react'
import { ScanlineOverlay } from '../../src/components/Terminal/ScanlineOverlay'
import { useAppStore } from '../../src/store/app'

afterEach(() => {
  useAppStore.setState({ scanlinesEnabled: true })
})

describe('ScanlineOverlay', () => {
  it('renders a div with class "scanlines" when scanlinesEnabled is true', () => {
    useAppStore.setState({ scanlinesEnabled: true })
    const { container } = render(<ScanlineOverlay />)
    const scanlineDiv = container.querySelector('.scanlines')
    expect(scanlineDiv).toBeInTheDocument()
  })

  it('renders nothing when scanlinesEnabled is false', () => {
    useAppStore.setState({ scanlinesEnabled: false })
    const { container } = render(<ScanlineOverlay />)
    expect(container.innerHTML).toBe('')
  })
})
