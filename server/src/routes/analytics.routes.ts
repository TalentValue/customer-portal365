import { Router } from 'express'
import { analyticsController } from '../controllers/analytics.controller'
import { authenticate } from '../middlewares/authenticate'
import { authorize } from '../middlewares/authorize'

const router = Router()
router.use(authenticate, authorize('SUPER_ADMIN', 'ADMIN'))

router.get('/dashboard', analyticsController.dashboard)
router.get('/', analyticsController.analytics)

export default router
