import { useState, useRef } from 'react'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Progress } from '../../../components/ui/progress'
import { 
  Upload, 
  File, 
  CheckCircle, 
  AlertCircle, 
  X,
  Cloud
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog'
import { MeetingAgentService } from '../../../services/meetingAgentService'
import { useToast } from '../../../components/ui/use-toast'

interface RecordingUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionId: string
  sessionTitle?: string
  onUploadComplete?: () => void
}

export function RecordingUploadDialog({
  open,
  onOpenChange,
  sessionId,
  sessionTitle,
  onUploadComplete
}: RecordingUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadComplete, setUploadComplete] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/mkv', 'video/webm']
      if (!validTypes.includes(file.type) && !file.name.match(/\.(mp4|avi|mov|mkv|webm)$/i)) {
        toast({
          title: 'Invalid File Type',
          description: 'Please select a valid video file (MP4, AVI, MOV, MKV, or WebM)',
          variant: 'destructive'
        })
        return
      }

      // Validate file size (max 1GB)
      const maxSize = 1024 * 1024 * 1024 // 1GB in bytes
      if (file.size > maxSize) {
        toast({
          title: 'File Too Large',
          description: 'Please select a file smaller than 1GB',
          variant: 'destructive'
        })
        return
      }

      setSelectedFile(file)
      setUploadError(null)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setUploadProgress(0)
    setUploadError(null)

    try {
      const result = await MeetingAgentService.uploadRecordingToS3(
        sessionId,
        selectedFile,
        (progress) => setUploadProgress(progress)
      )

      if (result.success) {
        setUploadComplete(true)
        toast({
          title: 'Upload Successful',
          description: 'Your meeting recording has been saved to the cloud'
        })
        
        // Call completion callback
        onUploadComplete?.()
        
        // Close dialog after a brief delay
        setTimeout(() => {
          handleClose()
        }, 2000)
      } else {
        throw new Error(result.message || 'Upload failed')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      setUploadError(errorMessage)
      toast({
        title: 'Upload Failed',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    if (!isUploading) {
      setSelectedFile(null)
      setUploadProgress(0)
      setUploadComplete(false)
      setUploadError(null)
      onOpenChange(false)
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-zinc-900 border-zinc-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Upload Recording
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Upload your meeting recording to the cloud for {sessionTitle || 'this session'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!selectedFile && !uploadComplete && (
            <Card className="bg-zinc-800 border-zinc-700">
              <CardContent className="p-6">
                <div className="text-center">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-zinc-400" />
                  <h3 className="text-white font-medium mb-2">Select Recording File</h3>
                  <p className="text-zinc-400 text-sm mb-4">
                    Choose a video file from your computer (MP4, AVI, MOV, MKV, WebM)
                  </p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-zinc-700 hover:bg-zinc-600 text-white"
                  >
                    <File className="h-4 w-4 mr-2" />
                    Browse Files
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*,.mp4,.avi,.mov,.mkv,.webm"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <p className="text-zinc-500 text-xs mt-2">Max file size: 1GB</p>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedFile && !uploadComplete && (
            <Card className="bg-zinc-800 border-zinc-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm">Selected File</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <File className="h-8 w-8 text-blue-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{selectedFile.name}</p>
                    <p className="text-zinc-400 text-sm">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  {!isUploading && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                      className="text-zinc-400 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-300">Uploading...</span>
                      <span className="text-zinc-300">{Math.round(uploadProgress)}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}

                {uploadError && (
                  <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-700/50 rounded-lg mt-3">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <p className="text-red-300 text-sm">{uploadError}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {uploadComplete && (
            <Card className="bg-zinc-800 border-zinc-700">
              <CardContent className="p-6">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-400" />
                  <h3 className="text-white font-medium mb-2">Upload Complete!</h3>
                  <p className="text-zinc-400 text-sm">
                    Your recording has been successfully uploaded to the cloud and is now available in your files.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          {!uploadComplete && (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isUploading}
                className="text-white border-zinc-600"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isUploading ? (
                  <>
                    <Upload className="h-4 w-4 mr-2 animate-pulse" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Cloud className="h-4 w-4 mr-2" />
                    Upload to Cloud
                  </>
                )}
              </Button>
            </>
          )}
          {uploadComplete && (
            <Button
              onClick={handleClose}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
