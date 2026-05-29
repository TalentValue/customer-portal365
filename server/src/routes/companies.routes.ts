import { Router } from 'express'
import multer from 'multer'
import { companiesController } from '../controllers/companies.controller'
import { settingsController } from '../controllers/settings.controller'
import { authenticate } from '../middlewares/authenticate'
import { authorize } from '../middlewares/authorize'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })

router.use(authenticate)

router.get('/', companiesController.list)
router.post('/', authorize('SUPER_ADMIN', 'ADMIN'), companiesController.create)
router.get('/:id', companiesController.get)
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN'), companiesController.update)
router.delete('/:id', authorize('SUPER_ADMIN'), companiesController.delete)
router.patch('/:id/archive', authorize('SUPER_ADMIN', 'ADMIN'), companiesController.archive)
router.post('/:id/logo', authorize('SUPER_ADMIN', 'ADMIN'), upload.single('logo'), companiesController.uploadLogo)

// Per-company settings
router.get('/:id/settings', authorize('SUPER_ADMIN', 'ADMIN'), settingsController.listForCompany)
router.put('/:id/settings', authorize('SUPER_ADMIN', 'ADMIN'), settingsController.upsertForCompany)

// Company dashboard data
router.get('/:id/activity', authorize('SUPER_ADMIN', 'ADMIN'), companiesController.getActivity)
router.get('/:id/uploads', authorize('SUPER_ADMIN', 'ADMIN'), companiesController.getUploads)
router.get('/:id/notifications', authorize('SUPER_ADMIN', 'ADMIN'), companiesController.getNotifications)

export default router
