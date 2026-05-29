import { Router } from 'express'
import { templatesController } from '../controllers/templates.controller'
import { authenticate } from '../middlewares/authenticate'
import { authorize } from '../middlewares/authorize'

const router = Router()

router.use(authenticate)

router.get('/', templatesController.list)
router.post('/', authorize('SUPER_ADMIN', 'ADMIN'), templatesController.create)
router.get('/:id', templatesController.get)
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN'), templatesController.update)
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), templatesController.delete)

export default router
