import { Router } from 'express'
import { auditController } from '../controllers/audit.controller'
import { authenticate } from '../middlewares/authenticate'
import { authorize } from '../middlewares/authorize'

const router = Router()
router.use(authenticate, authorize('SUPER_ADMIN', 'ADMIN'))
router.get('/', auditController.list)

export default router
