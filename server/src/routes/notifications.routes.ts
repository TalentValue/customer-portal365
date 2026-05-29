import { Router } from 'express'
import { notificationsController } from '../controllers/notifications.controller'
import { authenticate } from '../middlewares/authenticate'

const router = Router()
router.use(authenticate)

router.get('/', notificationsController.list)
router.get('/unread-count', notificationsController.unreadCount)
router.patch('/read-all', notificationsController.markAllRead)
router.patch('/:id/read', notificationsController.markRead)
router.delete('/:id', notificationsController.delete)

export default router
