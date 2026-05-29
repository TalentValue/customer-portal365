import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'

export class AppError extends Error {
  constructor(public message: string, public statusCode = 400) {
    super(message)
    this.name = 'AppError'
  }
}

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message })
    return
  }
  logger.error('Unhandled error', {
    name: err.name,
    message: err.message,
    path: req.path,
    method: req.method,
  })
  res.status(500).json({ message: 'Internal server error' })
}
