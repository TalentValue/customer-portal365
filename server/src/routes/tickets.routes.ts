import { Router } from 'express'
import multer from 'multer'
import { ticketsController } from '../controllers/tickets.controller'
import { authenticate } from '../middlewares/authenticate'
import { authorize } from '../middlewares/authorize'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } })

router.use(authenticate)

router.get('/', ticketsController.list)
router.post('/', ticketsController.create)
router.get('/:id', ticketsController.get)
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN'), ticketsController.update)
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), ticketsController.delete)
router.patch('/:id/status', authorize('SUPER_ADMIN', 'ADMIN'), ticketsController.updateStatus)
router.patch('/:id/archive', authorize('SUPER_ADMIN', 'ADMIN'), ticketsController.archive)

router.get('/:id/comments', ticketsController.getComments)
router.post('/:id/comments', ticketsController.addComment)
router.delete('/:id/comments/:commentId', ticketsController.deleteComment)

router.get('/:id/attachments', ticketsController.getAttachments)
router.post('/:id/attachments', upload.single('file'), ticketsController.uploadAttachment)
router.delete('/:id/attachments/:attachmentId', ticketsController.deleteAttachment)

router.post('/:id/watch', ticketsController.watch)
router.delete('/:id/watch', ticketsController.watch)

router.get('/:id/activity', ticketsController.getActivity)
router.patch('/:id/client-complete', authorize('CLIENT'), ticketsController.clientComplete)

export default router
