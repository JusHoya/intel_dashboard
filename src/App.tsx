import { useEffect } from 'react'
import { TilingLayout } from './components/Layout'
import { StatusBar, ScanlineOverlay, CommandBar } from './components/Terminal'
import { useGeoLinking } from './feeds/geolink'
import { useCommandStore } from './store/command'

function App() {
  useGeoLinking()

  const openCommandBar = useCommandStore((s) => s.open)
  const isCommandBarOpen = useCommandStore((s) => s.isOpen)
  const closeCommandBar = useCommandStore((s) => s.close)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ctrl+K (or Cmd+K on Mac) toggles the command bar
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        if (isCommandBarOpen) {
          closeCommandBar()
        } else {
          openCommandBar()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [openCommandBar, closeCommandBar, isCommandBarOpen])

  return (
    <>
      <TilingLayout />
      <StatusBar />
      <ScanlineOverlay />
      <CommandBar />
    </>
  )
}

export default App
