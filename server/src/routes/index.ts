import { Router } from 'express'
import authRoutes from './auth.routes'
import companiesRoutes from './companies.routes'
import contactsRoutes from './contacts.routes'
import ticketsRoutes from './tickets.routes'
import notificationsRoutes from './notifications.routes'
import analyticsRoutes from './analytics.routes'
import auditRoutes from './audit.routes'
import teamsRoutes from './teams.routes'
import settingsRoutes from './settings.routes'
import templatesRoutes from './templates.routes'
import { authenticate } from '../middlewares/authenticate'
import { authorize } from '../middlewares/authorize'
import { usersController } from '../controllers/users.controller'

const router = Router()

router.use('/auth', authRoutes)
router.use('/companies', companiesRoutes)
router.use('/contacts', contactsRoutes)
router.use('/tickets', ticketsRoutes)
router.use('/notifications', notificationsRoutes)
router.use('/analytics', analyticsRoutes)
router.use('/audit-logs', auditRoutes)
router.use('/teams', teamsRoutes)
router.use('/settings', settingsRoutes)
router.use('/templates', templatesRoutes)

// Users list — used by assignee picker and team member selection
router.get('/users', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), usersController.list)

export default router
