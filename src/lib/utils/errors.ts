import { NextResponse } from 'next/server';

export class AppError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly details?: unknown;

  constructor(code: string, message: string, statusCode = 400, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function createErrorResponse(
  code: string,
  message: string,
  statusCode = 400,
  details?: unknown
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    },
    { status: statusCode }
  );
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return createErrorResponse(error.code, error.message, error.statusCode, error.details);
  }

  const message = error instanceof Error ? error.message : 'An internal server error occurred.';
  console.error('Unhandled API Error:', error);

  return createErrorResponse('INTERNAL_SERVER_ERROR', message, 500);
}
