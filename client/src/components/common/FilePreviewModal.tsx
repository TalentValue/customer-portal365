import { X, Download, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FilePreviewModalProps {
  fileUrl: string
  fileName: string
  fileType: string
  onClose: () => void
}

function isImage(mimeType: string) {
  return mimeType.startsWith('image/')
}

function isPDF(mimeType: string) {
  return mimeType === 'application/pdf'
}

export function FilePreviewModal({ fileUrl, fileName, fileType, onClose }: FilePreviewModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className="relative bg-background rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
          <span className="font-medium text-sm truncate max-w-lg">{fileName}</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <a href={fileUrl} download={fileName} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-1.5" /> Download
              </a>
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-0">
          {isImage(fileType) ? (
            <img
              src={fileUrl}
              alt={fileName}
              className="max-w-full max-h-full object-contain rounded"
            />
          ) : isPDF(fileType) ? (
            <iframe
              src={fileUrl}
              title={fileName}
              className="w-full h-[70vh] rounded border"
            />
          ) : (
            <div className="flex flex-col items-center gap-4 text-center py-12">
              <FileText className="h-16 w-16 text-muted-foreground" />
              <div>
                <p className="font-medium">{fileName}</p>
                <p className="text-sm text-muted-foreground mt-1">Preview not available for this file type.</p>
              </div>
              <Button asChild>
                <a href={fileUrl} download={fileName} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-2" /> Download File
                </a>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
