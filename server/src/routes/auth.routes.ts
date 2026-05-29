import { Router } from 'express'
import { authController } from '../controllers/auth.controller'
import { authenticate } from '../middlewares/authenticate'
import { authorize } from '../middlewares/authorize'

const router = Router()

router.post('/login', authController.login)
router.post('/logout', authController.logout)
router.post('/refresh', authController.refresh)
router.get('/me', authenticate, authController.me)
router.post('/invite', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), authController.invite)
router.post('/accept-invite', authController.acceptInvite)
router.post('/forgot-password', authController.forgotPassword)
router.post('/reset-password', authController.resetPassword)
router.put('/change-password', authenticate, authController.changePassword)
router.put('/profile', authenticate, authController.updateProfile)
router.get('/notification-preferences', authenticate, authController.getNotificationPreferences)
router.put('/notification-preferences', authenticate, authController.updateNotificationPreferences)

export default router
