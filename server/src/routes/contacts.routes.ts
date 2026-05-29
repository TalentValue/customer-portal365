import { Router } from 'express'
import { contactsController } from '../controllers/contacts.controller'
import { authenticate } from '../middlewares/authenticate'
import { authorize } from '../middlewares/authorize'

const router = Router()
router.use(authenticate, authorize('SUPER_ADMIN', 'ADMIN'))

router.get('/', contactsController.list)
router.post('/', contactsController.create)
router.get('/:id', contactsController.get)
router.put('/:id', contactsController.update)
router.delete('/:id', contactsController.delete)
router.post('/:id/invite', contactsController.invite)

export default router
