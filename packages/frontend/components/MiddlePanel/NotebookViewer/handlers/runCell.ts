let pyodideReady: Promise<any> | null = null

function loadScriptOnce(src: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve()
      return
    }
    if (document.getElementById(id)) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.id = id
    script.src = src
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`))
    document.head.appendChild(script)
  })
}

async function ensurePyodide() {
  if (pyodideReady) return pyodideReady
  pyodideReady = (async () => {
    await loadScriptOnce('https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js', 'pyodide-js')
    const loadPyodide = (window as any).loadPyodide as (opts: { indexURL: string }) => Promise<any>
    if (!loadPyodide) throw new Error('Pyodide loader not available')
    const pyodide = await loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/' })
    return pyodide
  })()
  return pyodideReady
}

export async function runCodeCell({ code }: { code: string }): Promise<{ stdout: string; stderr: string; error?: any }> {
  const pyodide = await ensurePyodide()
  let stdout = ''
  let stderr = ''
  const origStdout = (pyodide as any)._module.print
  const origStderr = (pyodide as any)._module.printErr
  ;(pyodide as any)._module.print = (text: string) => { stdout += (stdout ? '\n' : '') + String(text) }
  ;(pyodide as any)._module.printErr = (text: string) => { stderr += (stderr ? '\n' : '') + String(text) }
  try {
    await pyodide.runPythonAsync(code)
    return { stdout, stderr }
  } catch (error) {
    return { stdout, stderr, error }
  } finally {
    ;(pyodide as any)._module.print = origStdout
    ;(pyodide as any)._module.printErr = origStderr
  }
}


