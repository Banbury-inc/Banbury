import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Box, LinearProgress, Button, Tooltip } from '@mui/material'
import { FileSystemItem } from '../../../utils/fileTreeUtils'
import { CONFIG } from '../../../config/config'
import { NotebookJamsocketApi } from '../../../../backend/notebooks/jamsocket'

interface NotebookLabViewerProps {
  file: FileSystemItem
  userInfo?: { username: string; email?: string } | null
}

export function NotebookLabViewer({ file }: NotebookLabViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [iframeKey, setIframeKey] = useState(0)

  const jupyterUrl = CONFIG.jupyterUrl
  const [spawnBaseUrl, setSpawnBaseUrl] = useState<string | null>(null)

  const src = useMemo(() => {
    const encodePath = (p: string) => encodeURI(p)
    const desiredPath = (file.path && file.path.endsWith('.ipynb')) ? file.path : file.name
    if (spawnBaseUrl) {
      const base = spawnBaseUrl.replace(/\/$/, '/')
      // Try to navigate directly to the notebook in Lab
      return `${base}lab/tree/${encodePath(desiredPath)}`
    }
    if (jupyterUrl) {
      const base = jupyterUrl.replace(/\/$/, '/')
      return `${base}lab/tree/${encodePath(desiredPath)}`
    }
    return ''
  }, [jupyterUrl, spawnBaseUrl, file.path, file.name])

  useEffect(() => {
    setIsLoading(true)
  }, [src])

  // Spawn backend if no static jupyterUrl configured
  useEffect(() => {
    if (jupyterUrl) return
    let cancelled = false
    const api = new NotebookJamsocketApi()
    setIsLoading(true)
    api.createOrGetBackend({ docId: file.path || file.name }).then(async (backend) => {
      if (cancelled || !backend) return
      try {
        await api.waitUntilReady(backend)
        if (cancelled) return
        // Use base to construct lab routes
        setSpawnBaseUrl(backend.url)
      } catch {
        if (!cancelled) setSpawnBaseUrl(null)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [jupyterUrl, file.path, file.name])

  if (!jupyterUrl && !spawnBaseUrl) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center max-w-md text-gray-300">
          <div className="text-white font-medium mb-2">No Jupyter server configured</div>
          <div className="text-sm">
            Set NEXT_PUBLIC_JUPYTER_URL to embed JupyterLab for viewing and editing notebooks.
          </div>
        </div>
      </div>
    )
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
      {isLoading && (
        <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, width: '100%', zIndex: 10 }} />
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.75, borderBottom: '1px solid rgba(255,255,255,0.08)', bgcolor: 'rgba(0,0,0,0.3)' }}>
        <Box sx={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={file.name}>
          {file.name}
        </Box>
        <Tooltip title="Reload">
          <span>
            <Button size="small" variant="outlined" onClick={() => { setIsLoading(true); setIframeKey((k) => k + 1) }} sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.25)', textTransform: 'none', px: 1.25, py: 0.25, fontSize: 12 }}>
              Reload
            </Button>
          </span>
        </Tooltip>
        <Tooltip title="Open in new tab">
          <span>
            <Button size="small" variant="outlined" onClick={() => window.open(src, '_blank', 'noopener,noreferrer')} sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.25)', textTransform: 'none', px: 1.25, py: 0.25, fontSize: 12 }}>
              Open
            </Button>
          </span>
        </Tooltip>
      </Box>
      <iframe
        key={iframeKey}
        ref={iframeRef}
        src={src}
        onLoad={() => setIsLoading(false)}
        allow="clipboard-read; clipboard-write"
        style={{ flexGrow: 1, border: 0, margin: 0, padding: 0 }}
        title={`Notebook: ${file.name}`}
      />
    </Box>
  )
}

export default NotebookLabViewer


