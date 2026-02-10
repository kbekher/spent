import { Request, Response, NextFunction } from 'express';
import { expressjwt as jwt, GetVerificationKey } from 'express-jwt';
import jwksRsa from 'jwks-rsa';

// Extend Express Request type to include auth property
declare global {
  namespace Express {
    interface Request {
      auth?: {
        sub: string;
        [key: string]: any;
      };
    }
  }
}

// Lazy-load JWT checker to ensure env vars are loaded
let _checkJwt: any = null;

const getCheckJwt = () => {
  if (!_checkJwt) {
    if (!process.env.AUTH0_DOMAIN || !process.env.AUTH0_AUDIENCE) {
      throw new Error('AUTH0_DOMAIN and AUTH0_AUDIENCE must be set in environment variables');
    }
    
    _checkJwt = jwt({
      secret: jwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
      }) as GetVerificationKey,
      audience: process.env.AUTH0_AUDIENCE,
      issuer: `https://${process.env.AUTH0_DOMAIN}/`,
      algorithms: ['RS256'],
    });
  }
  return _checkJwt;
};

// Auth0 JWT verification middleware wrapper
export const checkJwt = (req: Request, res: Response, next: NextFunction) => {
  return getCheckJwt()(req, res, next);
};

// Middleware to extract userId from Auth0 sub claim
export const extractUserId = (req: Request, res: Response, next: NextFunction) => {
  if (!req.auth?.sub) {
    return res.status(401).json({ error: 'Unauthorized: No user ID found' });
  }
  
  // Store the Auth0 ID for use in routes
  (req as any).userId = req.auth.sub;
  next();
};

// Error handler for JWT errors
export const handleJwtError = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Invalid token',
      message: err.message,
    });
  }
  next(err);
};
