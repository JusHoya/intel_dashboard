import { useCallback, useEffect, useRef, useState } from 'react'
import { useCommandStore } from '../../store/command'
import {
  parseCommand,
  executeCommand,
  getSuggestions,
  COMMAND_HINTS,
  type CommandResult,
} from '../../utils/commands'

export function CommandBar() {
  const isOpen = useCommandStore((s) => s.isOpen)
  const query = useCommandStore((s) => s.query)
  const history = useCommandStore((s) => s.history)
  const setQuery = useCommandStore((s) => s.setQuery)
  const close = useCommandStore((s) => s.close)
  const execute = useCommandStore((s) => s.execute)

  const inputRef = useRef<HTMLInputElement>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1)
  const [feedback, setFeedback] = useState<CommandResult | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [executing, setExecuting] = useState(false)

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure the DOM has rendered
      requestAnimationFrame(() => {
        inputRef.current?.focus()
      })
      setFeedback(null)
      setShowHistory(false)
    }
  }, [isOpen])

  // Update suggestions when query changes
  useEffect(() => {
    setSuggestions(getSuggestions(query))
    setSelectedSuggestion(-1)
    setShowHistory(false)
  }, [query])

  // Execute the current command
  const handleExecute = useCallback(async () => {
    const parsed = parseCommand(query)
    if (!parsed) {
      setFeedback({ ok: false, message: 'Unknown command. Try goto:, chart:, news:, view:, or clear' })
      return
    }

    setExecuting(true)
    try {
      const result = await executeCommand(parsed)
      setFeedback(result)
      execute(query)
    } catch {
      setFeedback({ ok: false, message: 'Command execution failed' })
    } finally {
      setExecuting(false)
    }
  }, [query, execute])

  // Keyboard handling
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
        return
      }

      if (e.key === 'Enter') {
        e.preventDefault()
        if (selectedSuggestion >= 0 && selectedSuggestion < suggestions.length) {
          // Fill from suggestion, then execute
          setQuery(suggestions[selectedSuggestion])
          // Execute after filling suggestion
          const parsed = parseCommand(suggestions[selectedSuggestion])
          if (parsed) {
            setExecuting(true)
            executeCommand(parsed)
              .then((result) => {
                setFeedback(result)
                execute(suggestions[selectedSuggestion])
              })
              .catch(() => {
                setFeedback({ ok: false, message: 'Command execution failed' })
              })
              .finally(() => setExecuting(false))
          }
        } else {
          void handleExecute()
        }
        return
      }

      if (e.key === 'Tab') {
        e.preventDefault()
        if (suggestions.length > 0) {
          const idx = selectedSuggestion >= 0 ? selectedSuggestion : 0
          setQuery(suggestions[idx])
        }
        return
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        if (showHistory && history.length > 0) {
          setSelectedSuggestion((prev) =>
            prev < history.length - 1 ? prev + 1 : prev,
          )
        } else if (suggestions.length > 0) {
          setSelectedSuggestion((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : prev,
          )
        }
        return
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        if (!query && !showHistory && history.length > 0) {
          // Show history when pressing up on empty input
          setShowHistory(true)
          setSelectedSuggestion(history.length - 1)
        } else if (showHistory) {
          setSelectedSuggestion((prev) => (prev > 0 ? prev - 1 : 0))
        } else if (suggestions.length > 0) {
          setSelectedSuggestion((prev) => (prev > 0 ? prev - 1 : 0))
        }
        return
      }
    },
    [close, query, handleExecute, suggestions, selectedSuggestion, setQuery, execute, showHistory, history],
  )

  // Select history item
  const handleHistorySelect = useCallback(
    (item: string) => {
      setQuery(item)
      setShowHistory(false)
      inputRef.current?.focus()
    },
    [setQuery],
  )

  // Select suggestion
  const handleSuggestionSelect = useCallback(
    (item: string) => {
      setQuery(item)
      inputRef.current?.focus()
    },
    [setQuery],
  )

  // Click backdrop to close
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        close()
      }
    },
    [close],
  )

  if (!isOpen) return null

  const displayList = showHistory
    ? [...history].reverse()
    : suggestions

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
      onClick={handleBackdropClick}
    >
      <div
        className="w-full max-w-xl rounded border border-[#1a1a2e] bg-[#0d0d12] shadow-lg shadow-black/50"
        style={{ boxShadow: '0 0 30px rgba(0, 255, 65, 0.08)' }}
      >
        {/* Input row */}
        <div className="flex items-center border-b border-[#1a1a2e] px-4 py-3">
          <span className="mr-2 select-none font-mono text-sm text-[#00ff41]">&gt;</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command... (goto:, chart:, news:, view:, clear)"
            className="flex-1 bg-transparent font-mono text-sm text-[#00ff41] placeholder-neutral-600 outline-none caret-[#00ff41]"
            spellCheck={false}
            autoComplete="off"
          />
          {executing && (
            <span className="ml-2 animate-pulse font-mono text-xs text-[#00ff41]">...</span>
          )}
        </div>

        {/* Feedback message */}
        {feedback && (
          <div
            className={`border-b border-[#1a1a2e] px-4 py-2 font-mono text-xs ${
              feedback.ok ? 'text-[#00ff41]' : 'text-red-400'
            }`}
          >
            {feedback.ok ? '[OK]' : '[ERR]'} {feedback.message}
          </div>
        )}

        {/* Suggestions / History list */}
        {displayList.length > 0 && (
          <div className="max-h-48 overflow-y-auto">
            {showHistory && (
              <div className="border-b border-[#1a1a2e] px-4 py-1">
                <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                  History
                </span>
              </div>
            )}
            {displayList.map((item, i) => (
              <button
                key={`${item}-${i}`}
                className={`flex w-full items-center px-4 py-2 text-left font-mono text-xs transition-colors ${
                  i === selectedSuggestion
                    ? 'bg-[#1a1a2e] text-[#00ff41]'
                    : 'text-neutral-400 hover:bg-[#1a1a2e]/50 hover:text-[#00ff41]'
                }`}
                onClick={() =>
                  showHistory
                    ? handleHistorySelect(item)
                    : handleSuggestionSelect(item)
                }
                onMouseEnter={() => setSelectedSuggestion(i)}
              >
                <span className="mr-2 text-neutral-600">&gt;</span>
                {item}
              </button>
            ))}
          </div>
        )}

        {/* Command hints (when no query) */}
        {!query && !showHistory && (
          <div className="px-4 py-3">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-neutral-500">
              Available Commands
            </div>
            <div className="space-y-1">
              {COMMAND_HINTS.map((hint) => (
                <div
                  key={hint.prefix}
                  className="flex items-center justify-between font-mono text-xs"
                >
                  <span className="text-[#00ff41]/80">{hint.prefix}</span>
                  <span className="text-neutral-500">{hint.description}</span>
                </div>
              ))}
            </div>
            {history.length > 0 && (
              <div className="mt-2 font-mono text-[10px] text-neutral-600">
                Press <span className="text-neutral-500">Up</span> for history
              </div>
            )}
          </div>
        )}

        {/* Footer with keyboard shortcuts */}
        <div className="flex items-center justify-between border-t border-[#1a1a2e] px-4 py-2">
          <div className="flex gap-3 font-mono text-[10px] text-neutral-600">
            <span>
              <kbd className="rounded border border-neutral-700 px-1 text-neutral-500">Enter</kbd>{' '}
              execute
            </span>
            <span>
              <kbd className="rounded border border-neutral-700 px-1 text-neutral-500">Tab</kbd>{' '}
              autocomplete
            </span>
            <span>
              <kbd className="rounded border border-neutral-700 px-1 text-neutral-500">Esc</kbd>{' '}
              close
            </span>
          </div>
          <span className="font-mono text-[10px] text-neutral-600">SIGINT CMD</span>
        </div>
      </div>
    </div>
  )
}
