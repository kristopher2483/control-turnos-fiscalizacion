export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'HttpError';
  }
}

export const badRequest = (message: string): HttpError => new HttpError(400, message);
export const unauthorized = (message = 'No autorizado'): HttpError => new HttpError(401, message);
export const forbidden = (message = 'Acceso denegado'): HttpError => new HttpError(403, message);
export const notFound = (message = 'No encontrado'): HttpError => new HttpError(404, message);
export const conflict = (message: string): HttpError => new HttpError(409, message);
