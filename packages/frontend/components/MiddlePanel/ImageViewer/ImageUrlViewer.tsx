import Image from 'next/image'

interface ImageUrlViewerProps {
  src: string
  alt: string
}

export function ImageUrlViewer({ src, alt }: Readonly<ImageUrlViewerProps>) {
  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex flex-1 justify-center overflow-auto bg-background p-6">
        <Image
          src={src}
          alt={alt}
          width={1200}
          height={900}
          className="max-h-full max-w-full rounded-lg object-contain shadow-lg"
          unoptimized
        />
      </div>
    </div>
  )
}
