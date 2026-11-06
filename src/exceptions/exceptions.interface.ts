export interface IException {
  message: string;
  code?: number;
  description?: string;
  success?: boolean;
}

export interface IHttpBadRequestExceptionResponse {
  code: number;
  message: string;
  success: boolean;
}

export interface IHttpInternalServerErrorExceptionResponse {
  code: number;
  message: string;
  success: boolean;
}

export interface IHttpUnauthorizedExceptionResponse {
  code: number;
  message: string;
  success: boolean;
}

export interface IHttpForbiddenExceptionResponse {
  code: number;
  message: string;
  success: boolean;
}
