import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthenticatedUser } from '../types';

export function signToken(payload: AuthenticatedUser): string {
  const options: SignOptions = { expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.jwtSecret, options);
}

export function verifyToken(token: string): AuthenticatedUser {
  return jwt.verify(token, env.jwtSecret) as AuthenticatedUser;
}
