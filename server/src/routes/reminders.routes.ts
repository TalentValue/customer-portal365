import { Router } from 'express'
import { remindersController } from '../controllers/reminders.controller'
import { authenticate } from '../middlewares/authenticate'
import { authorize } from '../middlewares/authorize'

const router = Router()
router.use(authenticate, authorize('SUPER_ADMIN', 'ADMIN'))

router.get('/', remindersController.list)
router.post('/', remindersController.create)
router.patch('/:id/toggle', remindersController.toggle)
router.delete('/:id', remindersController.delete)

export default router
