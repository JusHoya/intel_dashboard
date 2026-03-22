import { create } from 'zustand'

interface CommandState {
  isOpen: boolean
  query: string
  history: string[]
  open: () => void
  close: () => void
  setQuery: (q: string) => void
  execute: (command: string) => void
}

export const useCommandStore = create<CommandState>((set, get) => ({
  isOpen: false,
  query: '',
  history: [],

  open: () => set({ isOpen: true, query: '' }),
  close: () => set({ isOpen: false, query: '' }),
  setQuery: (q) => set({ query: q }),

  execute: (command) => {
    const trimmed = command.trim()
    if (!trimmed) return

    const { history } = get()
    // Keep last 50 entries, avoid consecutive duplicates
    const newHistory =
      history[history.length - 1] === trimmed
        ? history
        : [...history.slice(-49), trimmed]

    set({ history: newHistory, query: '', isOpen: false })
  },
}))
