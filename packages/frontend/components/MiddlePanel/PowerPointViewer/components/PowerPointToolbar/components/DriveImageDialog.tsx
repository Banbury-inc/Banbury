import Image from 'next/image'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../../../ui/dialog'
import { Button } from '../../../../../ui/button'
import { Image as ImageIcon, RefreshCw } from 'lucide-react'
import type { DriveFile } from '../../../../../../../../backend/api/drive/drive'

interface DriveImageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  driveImages: DriveFile[]
  loading: boolean
  imageLoading: boolean
  onAddImage: (fileId: string) => void
}

export function DriveImageDialog({
  open,
  onOpenChange,
  driveImages,
  loading,
  imageLoading,
  onAddImage,
}: DriveImageDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Image from Google Drive</DialogTitle>
          <DialogDescription>
            Select an image from your Google Drive to add to your slide.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw size={24} className="animate-spin text-muted-foreground" />
            </div>
          ) : driveImages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No images found in Google Drive
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {driveImages.map((file) => (
                <button
                  key={file.id}
                  onClick={() => onAddImage(file.id)}
                  disabled={imageLoading}
                  className="relative aspect-square rounded-lg border-2 border-border hover:border-primary transition-colors overflow-hidden bg-muted disabled:opacity-50"
                >
                  {file.thumbnailLink ? (
                    <Image
                      src={file.thumbnailLink}
                      alt={file.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon size={32} className="text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-background/90 p-2 text-xs truncate">
                    {file.name}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={imageLoading}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
