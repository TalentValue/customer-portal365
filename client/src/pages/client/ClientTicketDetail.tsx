import { useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { sectionVariants, sectionContainer } from '@/utils/motionVariants'
import {
  ArrowLeft, CheckCircle, Calendar, Clock, Paperclip,
  MessageSquare, Download, FileText, Image as ImageIcon, Trash2,
} from 'lucide-react'
import { ticketsService } from '@/services/tickets.service'
import { StatusBadge } from '@/components/tickets/StatusBadge'
import { PriorityBadge } from '@/components/tickets/PriorityBadge'
import { RichTextEditor, RichTextDisplay } from '@/components/common/RichTextEditor'
import { FileUploader } from '@/components/common/FileUploader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/useToast'
import { formatDate, formatRelative, formatFileSize } from '@/utils/formatDate'
import { Ticket, TicketComment, TicketAttachment } from '@/types'

const TYPE_LABELS: Record<string, string> = {
  REQUIREMENT_REQUEST: 'Requirement Request',
  FILE_COLLECTION: 'File Collection',
  APPROVAL_REQUEST: 'Approval Request',
  BUG_REPORT: 'Bug Report',
  SUPPORT_REQUEST: 'Support Request',
  GENERAL_TASK: 'General Task',
  FOLLOW_UP: 'Follow Up',
}

const NON_COMPLETABLE = new Set(['COMPLETED', 'CLOSED', 'SUBMITTED', 'APPROVED', 'REJECTED', 'OVERDUE', 'DRAFT'])

export default function ClientTicketDetail() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [comment, setComment] = useState('')
  const [uploadKey, setUploadKey] = useState(0)
  const uploadedNames = useRef<Set<string>>(new Set())

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['tickets', id],
    queryFn: () => ticketsService.get(id!).then((r) => r.data),
    enabled: !!id,
  })

  const { data: comments = [] } = useQuery({
    queryKey: ['tickets', id, 'comments'],
    queryFn: () => ticketsService.getComments(id!).then((r) => r.data),
    enabled: !!id,
  })

  const { data: attachments = [] } = useQuery({
    queryKey: ['tickets', id, 'attachments'],
    queryFn: () => ticketsService.getAttachments(id!).then((r) => r.data),
    enabled: !!id,
  })

  const completeMutation = useMutation({
    mutationFn: () => ticketsService.clientComplete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', id] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      toast({ title: 'Ticket marked as complete' })
    },
    onError: () => toast({ variant: 'destructive', title: 'Could not complete ticket' }),
  })

  const commentMutation = useMutation({
    mutationFn: () => ticketsService.addComment(id!, comment, false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', id, 'comments'] })
      setComment('')
      toast({ title: 'Comment added' })
    },
    onError: () => toast({ variant: 'destructive', title: 'Failed to add comment' }),
  })

  const uploadMutation = useMutation({
    mutationFn: (file: File) => ticketsService.uploadAttachment(id!, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', id, 'attachments'] })
      toast({ title: 'File uploaded' })
    },
    onError: () => toast({ variant: 'destructive', title: 'Upload failed' }),
  })

  const deleteAttachmentMutation = useMutation({
    mutationFn: (attachmentId: string) => ticketsService.deleteAttachment(id!, attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', id, 'attachments'] })
      toast({ title: 'File deleted' })
    },
    onError: () => toast({ variant: 'destructive', title: 'Failed to delete file' }),
  })

  const handleFilesSelected = (files: File[]) => {
    for (const file of files) {
      const key = `${file.name}-${file.size}`
      if (!uploadedNames.current.has(key)) {
        uploadedNames.current.add(key)
        uploadMutation.mutate(file, {
          onSettled: () => {
            uploadedNames.current.delete(key)
            setUploadKey((k) => k + 1)
          },
        })
      }
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-3xl">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <p className="text-lg font-medium">Ticket not found</p>
        <Link to="/portal/tickets" className="mt-3 text-indigo-600 hover:underline text-sm">← Back to tickets</Link>
      </div>
    )
  }

  const canComplete = !NON_COMPLETABLE.has(ticket.status)

  return (
    <motion.div
      variants={sectionContainer}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-3xl"
    >
      {/* Back + header */}
      <motion.div variants={sectionVariants}>
        <Link
          to="/portal/tickets"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 transition-colors mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to tickets
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-800 leading-snug">{ticket.title}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
              <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-2.5 py-0.5">
                {TYPE_LABELS[ticket.type] ?? ticket.type}
              </span>
            </div>
          </div>

          {canComplete && (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={() => completeMutation.mutate()}
                disabled={completeMutation.isPending}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md shadow-green-200"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {completeMutation.isPending ? 'Completing…' : 'Mark as Complete'}
              </Button>
            </motion.div>
          )}
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-500">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" /> Opened {formatRelative(ticket.createdAt)}
          </span>
          {ticket.dueDate && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> Due {formatDate(ticket.dueDate)}
            </span>
          )}
        </div>
      </motion.div>

      {/* Description */}
      {ticket.description && (
        <motion.div variants={sectionVariants}>
          <Card className="glow-on-hover">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-sm shadow-indigo-200">
                  <FileText className="h-3.5 w-3.5 text-white" />
                </span>
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RichTextDisplay html={ticket.description} />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Comments */}
      <motion.div variants={sectionVariants}>
      <Card className="glow-on-hover">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-sm shadow-indigo-200">
              <MessageSquare className="h-3.5 w-3.5 text-white" />
            </span>
            Comments {comments.length > 0 && <span className="text-slate-400 font-normal">({comments.length})</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {comments.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4">No comments yet — be the first to add one.</p>
          )}
          {(comments as TicketComment[]).map((c) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback
                  className="text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
                >
                  {c.author.firstName?.[0]}{c.author.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-sm font-semibold text-slate-700">
                    {c.author.firstName} {c.author.lastName}
                  </span>
                  <span className="text-xs text-slate-400">{formatRelative(c.createdAt)}</span>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 text-sm">
                  <RichTextDisplay html={c.body} />
                </div>
              </div>
            </motion.div>
          ))}

          {/* Add comment */}
          <div className="pt-2 border-t border-slate-100">
            <RichTextEditor
              value={comment}
              onChange={setComment}
              placeholder="Add a comment…"
              className="mb-2"
            />
            <Button
              size="sm"
              disabled={!comment.trim() || comment === '<p></p>' || commentMutation.isPending}
              onClick={() => commentMutation.mutate()}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
            >
              {commentMutation.isPending ? 'Posting…' : 'Post Comment'}
            </Button>
          </div>
        </CardContent>
      </Card>
      </motion.div>

      {/* Attachments */}
      <motion.div variants={sectionVariants}>
      <Card className="glow-on-hover">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-sm shadow-indigo-200">
              <Paperclip className="h-3.5 w-3.5 text-white" />
            </span>
            Attachments {attachments.length > 0 && <span className="text-slate-400 font-normal">({attachments.length})</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(attachments as TicketAttachment[]).map((a) => (
            <div key={a.id} className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
              {a.fileType.startsWith('image/') ? (
                <ImageIcon className="h-4 w-4 text-blue-500 shrink-0" />
              ) : (
                <FileText className="h-4 w-4 text-slate-400 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{a.fileName}</p>
                <p className="text-xs text-slate-400">{formatFileSize(a.fileSize)} · {formatRelative(a.createdAt)}</p>
              </div>
              <a
                href={a.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-indigo-600 hover:text-indigo-800"
                title="Download"
              >
                <Download className="h-4 w-4" />
              </a>
              <button
                onClick={() => deleteAttachmentMutation.mutate(a.id)}
                disabled={deleteAttachmentMutation.isPending}
                className="shrink-0 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          <FileUploader
            key={uploadKey}
            onFilesSelected={handleFilesSelected}
            maxFiles={5}
          />
          {uploadMutation.isPending && (
            <p className="text-sm text-indigo-600 animate-pulse">Uploading…</p>
          )}
        </CardContent>
      </Card>
      </motion.div>
    </motion.div>
  )
}
