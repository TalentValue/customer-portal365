import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../utils/token'

export interface AuthRequest extends Request {
  user?: { userId: string; role: string; companyId?: string | null }
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Authentication required' })
    return
  }
  const token = header.slice(7)
  try {
    req.user = verifyAccessToken(token)
    next()
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' })
  }
}
