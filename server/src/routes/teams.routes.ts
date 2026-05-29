import { Router } from 'express'
import { teamsController } from '../controllers/teams.controller'
import { authenticate } from '../middlewares/authenticate'
import { authorize } from '../middlewares/authorize'

const router = Router()

router.use(authenticate)

router.get('/', teamsController.list)
router.post('/', authorize('SUPER_ADMIN', 'ADMIN'), teamsController.create)
router.get('/:id', teamsController.get)
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN'), teamsController.update)
router.delete('/:id', authorize('SUPER_ADMIN'), teamsController.delete)
router.post('/:id/members', authorize('SUPER_ADMIN', 'ADMIN'), teamsController.addMember)
router.delete('/:id/members/:userId', authorize('SUPER_ADMIN', 'ADMIN'), teamsController.removeMember)

export default router
