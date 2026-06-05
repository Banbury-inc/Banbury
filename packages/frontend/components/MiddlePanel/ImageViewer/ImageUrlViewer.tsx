import { useState } from 'react'
import Image from 'next/image'
import { AlertCircle } from 'lucide-react'

interface ImageUrlViewerProps {
  src: string
  alt: string
}

export function ImageUrlViewer({ src, alt }: Readonly<ImageUrlViewerProps>) {
  const [hasError, setHasError] = useState(false)

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex flex-1 items-center justify-center overflow-auto bg-background p-6">
        {hasError ? (
          <div className="flex max-w-md flex-col items-center gap-3 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">Image could not be loaded.</p>
          </div>
        ) : (
          <Image
            src={src}
            alt={alt}
            width={1200}
            height={900}
            className="max-h-full max-w-full rounded-lg object-contain shadow-lg"
            unoptimized
            onError={() => setHasError(true)}
          />
        )}
      </div>
    </div>
  )
}
