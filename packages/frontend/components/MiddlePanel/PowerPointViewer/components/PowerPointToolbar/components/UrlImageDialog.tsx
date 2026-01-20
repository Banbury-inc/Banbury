import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../../../ui/dialog'
import { Input } from '../../../../../ui/input'
import { Label } from '../../../../../ui/label'
import { Button } from '../../../../../ui/button'

interface UrlImageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageUrl: string
  onImageUrlChange: (url: string) => void
  onAddImage: () => void
  loading: boolean
}

export function UrlImageDialog({
  open,
  onOpenChange,
  imageUrl,
  onImageUrlChange,
  onAddImage,
  loading,
}: UrlImageDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Image from URL</DialogTitle>
          <DialogDescription>
            Enter the URL of an image to add to your slide. The image will be embedded in the presentation.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="image-url">Image URL</Label>
            <Input
              id="image-url"
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={(e) => onImageUrlChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !loading) {
                  onAddImage()
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => {
              onOpenChange(false)
              onImageUrlChange('')
            }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={onAddImage}
            disabled={!imageUrl.trim() || loading}
          >
            {loading ? 'Loading...' : 'Add Image'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
