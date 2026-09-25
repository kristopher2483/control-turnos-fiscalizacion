import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthenticatedUser } from '../types';

export function signToken(payload: AuthenticatedUser): string {
  const options: SignOptions = { expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.jwtSecret, options);
}

export function verifyToken(token: string): AuthenticatedUser {
  // Pinning the algorithm is defense-in-depth against algorithm-confusion attacks, even though
  // jsonwebtoken already rejects an attacker-supplied "alg: none" token when a secret is provided.
  return jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] }) as AuthenticatedUser;
}
