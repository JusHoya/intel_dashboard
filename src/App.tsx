import { TilingLayout } from './components/Layout'
import { StatusBar } from './components/Terminal'
import { ScanlineOverlay } from './components/Terminal'

function App() {
  return (
    <>
      <TilingLayout />
      <StatusBar />
      <ScanlineOverlay />
    </>
  )
}

export default App
