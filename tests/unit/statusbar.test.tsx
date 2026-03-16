import { render, screen } from '@testing-library/react'
import { StatusBar } from '../../src/components/Terminal/StatusBar'
import { useAppStore } from '../../src/store/app'

afterEach(() => {
  useAppStore.setState({ feedHealth: [] })
})

describe('StatusBar', () => {
  it('renders "SIGINT DASHBOARD v0.1.0"', () => {
    render(<StatusBar />)
    expect(screen.getByText('SIGINT DASHBOARD v0.1.0')).toBeInTheDocument()
  })

  it('renders UTC clock text', () => {
    render(<StatusBar />)
    expect(screen.getByText('UTC')).toBeInTheDocument()
  })

  it('renders "UPTIME" text', () => {
    render(<StatusBar />)
    expect(screen.getByText('UPTIME')).toBeInTheDocument()
  })

  it('shows "NO FEEDS" when feedHealth is empty', () => {
    render(<StatusBar />)
    expect(screen.getByText('NO FEEDS')).toBeInTheDocument()
  })
})
