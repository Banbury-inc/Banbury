import { FORMULA_SPECS } from '../utils/formulas-list'

interface CreateFormulaSuggestionHandlersParams {
  hotTableRef: React.RefObject<any>
}

export function createFormulaSuggestionHandlers({ hotTableRef }: CreateFormulaSuggestionHandlersParams) {
  const suggestionContainerId = 'ht-formula-suggestions'

  function ensureContainer(): HTMLDivElement {
    let el = document.getElementById(suggestionContainerId) as HTMLDivElement | null
    if (!el) {
      el = document.createElement('div')
      el.id = suggestionContainerId
      el.style.position = 'absolute'
      el.style.zIndex = '9999'
      el.style.background = '#ffffff'
      el.style.border = '1px solid #e5e7eb'
      el.style.borderRadius = '6px'
      el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'
      el.style.minWidth = '260px'
      el.style.maxHeight = '260px'
      el.style.overflowY = 'auto'
      el.style.fontFamily = 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial'
      el.style.fontSize = '12px'
      el.style.color = '#111827'
      document.body.appendChild(el)
    }
    return el
  }

  function hideSuggestions() {
    const el = document.getElementById(suggestionContainerId)
    if (el) el.style.display = 'none'
  }

  function showSuggestions(items: string[], x: number, y: number) {
    const el = ensureContainer()
    el.innerHTML = ''
    const list = document.createElement('div')
    list.style.padding = '8px 0'
    items.forEach((name) => {
      const spec = FORMULA_SPECS.find((s) => s.name === name)
      const row = document.createElement('div')
      row.style.display = 'grid'
      row.style.gridTemplateColumns = '120px 1fr'
      row.style.gap = '8px'
      row.style.padding = '8px 12px'
      row.style.cursor = 'pointer'
      row.addEventListener('mouseenter', () => { row.style.background = '#f3f4f6' })
      row.addEventListener('mouseleave', () => { row.style.background = 'transparent' })
      row.addEventListener('mousedown', (e) => {
        e.preventDefault()
        applySuggestion(name)
      })
      const nameEl = document.createElement('div')
      nameEl.textContent = spec?.name || name
      nameEl.style.fontWeight = '600'
      nameEl.style.color = '#111827'
      const descEl = document.createElement('div')
      descEl.textContent = spec?.description || ''
      descEl.style.color = '#374151'
      row.appendChild(nameEl)
      row.appendChild(descEl)
      list.appendChild(row)
    })
    el.appendChild(list)
    el.style.left = `${x}px`
    el.style.top = `${y}px`
    el.style.display = 'block'
  }

  function filterFormulaNames(prefix: string): string[] {
    if (!prefix) return []
    const p = prefix.toUpperCase()
    return FORMULA_SPECS.map((s) => s.name).filter((n) => n.startsWith(p)).slice(0, 20)
  }

  function getEditorCaretScreenPosition(): { x: number; y: number } | null {
    try {
      const editorEl = document.querySelector('.handsontableInput') as HTMLTextAreaElement | null
      if (!editorEl) return null
      const rect = editorEl.getBoundingClientRect()
      return { x: rect.left, y: rect.bottom + 6 }
    } catch {
      return null
    }
  }

  function applySuggestion(name: string) {
    const hot = hotTableRef.current?.hotInstance
    if (!hot) return
    const sel = hot.getSelectedLast?.()
    if (!sel) return
    const [r, c] = [sel[0], sel[1]]
    const current = hot.getSourceDataAtCell(r, c)
    const base = typeof current === 'string' ? current : ''
    const prefix = base.startsWith('=') ? base.slice(1) : base
    const rest = (prefix.includes('(') ? prefix.slice(prefix.indexOf('(')) : '(')
    const next = `=${name}${rest}`
    hot.setDataAtCell(r, c, next, 'edit')
    hideSuggestions()
    // Reopen editor after applying suggestion
    try { hot.selectCell(r, c); hot.getActiveEditor()?.beginEditing() } catch {}
  }

  function onEditorKeyup(e: KeyboardEvent) {
    try {
      const editorEl = document.querySelector('.handsontableInput') as HTMLTextAreaElement | null
      if (!editorEl) { hideSuggestions(); return }
      const value = editorEl.value || ''
      if (!value.startsWith('=')) { hideSuggestions(); return }
      const afterEq = value.slice(1)
      const namePrefix = afterEq.replace(/[^A-Za-z].*$/, '')
      const matches = filterFormulaNames(namePrefix)
      if (matches.length === 0) { hideSuggestions(); return }
      const pos = getEditorCaretScreenPosition()
      if (!pos) { hideSuggestions(); return }
      showSuggestions(matches, pos.x, pos.y)
    } catch {
      hideSuggestions()
    }
  }

  function onEditorBlur() { hideSuggestions() }

  function attach() {
    document.addEventListener('keyup', onEditorKeyup, true)
    document.addEventListener('click', onEditorBlur, true)
  }

  function detach() {
    document.removeEventListener('keyup', onEditorKeyup, true)
    document.removeEventListener('click', onEditorBlur, true)
    hideSuggestions()
  }

  return { attach, detach }
}

export type { CreateFormulaSuggestionHandlersParams }


