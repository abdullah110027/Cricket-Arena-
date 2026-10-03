import { NextResponse } from 'next/server';

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unexpected server error.';
}
