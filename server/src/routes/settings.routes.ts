import { Router } from 'express'
import { settingsController } from '../controllers/settings.controller'
import { authenticate } from '../middlewares/authenticate'
import { authorize } from '../middlewares/authorize'

const router = Router()

router.use(authenticate)

router.get('/', authorize('SUPER_ADMIN', 'ADMIN'), settingsController.list)
router.get('/:key', authorize('SUPER_ADMIN', 'ADMIN'), settingsController.get)
router.put('/', authorize('SUPER_ADMIN'), settingsController.upsertMany)
router.post('/test-email', authorize('SUPER_ADMIN', 'ADMIN'), settingsController.testEmail)

export default router
