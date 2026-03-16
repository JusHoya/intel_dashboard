import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useGlobeStore } from '../../src/store/globe'
import { InfoPanel } from '../../src/components/Panels/InfoPanel'

afterEach(() => {
  useGlobeStore.setState({ selectedEntity: null, globeReady: false })
})

describe('InfoPanel', () => {
  it('renders "ENTITY INTEL" header', () => {
    render(<InfoPanel />)
    expect(screen.getByText(/entity intel/i)).toBeInTheDocument()
  })

  it('shows "SELECT TARGET ON GLOBE" when no entity is selected', () => {
    render(<InfoPanel />)
    expect(screen.getByText('SELECT TARGET ON GLOBE')).toBeInTheDocument()
  })

  it('shows entity name when an entity is selected', () => {
    useGlobeStore.setState({
      selectedEntity: {
        id: 'US',
        type: 'country',
        name: 'United States',
        coordinates: { latitude: 39.8283, longitude: -98.5795 },
        metadata: { iso_a3: 'USA', region: 'Americas' },
      },
    })

    render(<InfoPanel />)
    expect(screen.getByText('United States')).toBeInTheDocument()
  })

  it('shows coordinates when entity is selected', () => {
    useGlobeStore.setState({
      selectedEntity: {
        id: 'US',
        type: 'country',
        name: 'United States',
        coordinates: { latitude: 39.8283, longitude: -98.5795 },
        metadata: { iso_a3: 'USA', region: 'Americas' },
      },
    })

    render(<InfoPanel />)
    expect(screen.getByText(/39\.8283/)).toBeInTheDocument()
    expect(screen.getByText(/-98\.5795/)).toBeInTheDocument()
  })

  it('shows entity type badge', () => {
    useGlobeStore.setState({
      selectedEntity: {
        id: 'US',
        type: 'country',
        name: 'United States',
        coordinates: { latitude: 39.8283, longitude: -98.5795 },
        metadata: { iso_a3: 'USA', region: 'Americas' },
      },
    })

    render(<InfoPanel />)
    expect(screen.getByText('country')).toBeInTheDocument()
  })

  it('shows "CLEAR" button when entity is selected', () => {
    useGlobeStore.setState({
      selectedEntity: {
        id: 'US',
        type: 'country',
        name: 'United States',
        coordinates: { latitude: 39.8283, longitude: -98.5795 },
        metadata: { iso_a3: 'USA', region: 'Americas' },
      },
    })

    render(<InfoPanel />)
    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument()
  })

  it('clicking CLEAR button clears the selection', async () => {
    useGlobeStore.setState({
      selectedEntity: {
        id: 'US',
        type: 'country',
        name: 'United States',
        coordinates: { latitude: 39.8283, longitude: -98.5795 },
        metadata: { iso_a3: 'USA', region: 'Americas' },
      },
    })

    render(<InfoPanel />)

    const clearButton = screen.getByRole('button', { name: /clear/i })
    await userEvent.click(clearButton)

    expect(useGlobeStore.getState().selectedEntity).toBeNull()
  })
})
