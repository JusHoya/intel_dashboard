import { TilingLayout } from './components/Layout'
import { StatusBar } from './components/Terminal'
import { ScanlineOverlay } from './components/Terminal'
import { useGeoLinking } from './feeds/geolink'

function App() {
  useGeoLinking()

  return (
    <>
      <TilingLayout />
      <StatusBar />
      <ScanlineOverlay />
    </>
  )
}

export default App
