import { spawn } from 'child_process'

const DEFAULT_TIMEOUT_MS = 30_000
const DEFAULT_MAX_OUTPUT_BYTES = 256_000

interface RunCommandResult {
  commandFound: boolean
  stdout: string
  stderr: string
  exitCode: number
  timedOut: boolean
  truncated: boolean
}

export interface ExecutePythonInput {
  cwd: string
  relativeFilePath: string
  timeoutMs?: number
  maxOutputBytes?: number
}

export interface ExecutePythonResult {
  success: boolean
  stdout: string
  stderr: string
  exitCode: number
  timedOut: boolean
  truncated: boolean
  interpreter: string
}

function appendChunk(
  current: string,
  chunk: Buffer,
  remainingBytes: number
): { nextValue: string; nextRemainingBytes: number; truncated: boolean } {
  if (remainingBytes <= 0) return { nextValue: current, nextRemainingBytes: 0, truncated: true }

  if (chunk.byteLength <= remainingBytes) {
    return {
      nextValue: current + chunk.toString('utf8'),
      nextRemainingBytes: remainingBytes - chunk.byteLength,
      truncated: false,
    }
  }

  const partial = chunk.subarray(0, remainingBytes)
  return {
    nextValue: current + partial.toString('utf8'),
    nextRemainingBytes: 0,
    truncated: true,
  }
}

function runCommand(
  interpreter: string,
  filePath: string,
  cwd: string,
  timeoutMs: number,
  maxOutputBytes: number
): Promise<RunCommandResult> {
  return new Promise((resolve) => {
    let stdout = ''
    let stderr = ''
    let stdoutRemainingBytes = maxOutputBytes
    let stderrRemainingBytes = maxOutputBytes
    let timedOut = false
    let truncated = false
    let commandFound = true
    let completed = false

    function finish(result: RunCommandResult) {
      if (completed) return
      completed = true
      resolve(result)
    }

    const child = spawn(interpreter, [filePath], {
      cwd,
      env: {
        ...process.env,
        PYTHONUNBUFFERED: '1',
      },
    })

    const timeout = setTimeout(() => {
      timedOut = true
      child.kill('SIGKILL')
    }, timeoutMs)

    child.stdout.on('data', (chunk: Buffer) => {
      const appended = appendChunk(stdout, chunk, stdoutRemainingBytes)
      stdout = appended.nextValue
      stdoutRemainingBytes = appended.nextRemainingBytes
      truncated = truncated || appended.truncated
    })

    child.stderr.on('data', (chunk: Buffer) => {
      const appended = appendChunk(stderr, chunk, stderrRemainingBytes)
      stderr = appended.nextValue
      stderrRemainingBytes = appended.nextRemainingBytes
      truncated = truncated || appended.truncated
    })

    child.on('error', (error) => {
      clearTimeout(timeout)
      commandFound = false
      finish({
        commandFound,
        stdout,
        stderr: error.message || `${interpreter} is not available`,
        exitCode: 127,
        timedOut: false,
        truncated,
      })
    })

    child.on('close', (code) => {
      clearTimeout(timeout)
      finish({
        commandFound,
        stdout,
        stderr,
        exitCode: code ?? 1,
        timedOut,
        truncated,
      })
    })
  })
}

export async function executePython({
  cwd,
  relativeFilePath,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  maxOutputBytes = DEFAULT_MAX_OUTPUT_BYTES,
}: ExecutePythonInput): Promise<ExecutePythonResult> {
  const primary = await runCommand('python3', relativeFilePath, cwd, timeoutMs, maxOutputBytes)

  if (primary.commandFound) {
    return {
      success: primary.exitCode === 0 && !primary.timedOut,
      stdout: primary.stdout,
      stderr: primary.stderr,
      exitCode: primary.exitCode,
      timedOut: primary.timedOut,
      truncated: primary.truncated,
      interpreter: 'python3',
    }
  }

  const fallback = await runCommand('python', relativeFilePath, cwd, timeoutMs, maxOutputBytes)
  if (!fallback.commandFound) {
    return {
      success: false,
      stdout: '',
      stderr: 'Neither python3 nor python is available on the server.',
      exitCode: 127,
      timedOut: false,
      truncated: false,
      interpreter: 'none',
    }
  }

  return {
    success: fallback.exitCode === 0 && !fallback.timedOut,
    stdout: fallback.stdout,
    stderr: fallback.stderr,
    exitCode: fallback.exitCode,
    timedOut: fallback.timedOut,
    truncated: fallback.truncated,
    interpreter: 'python',
  }
}
