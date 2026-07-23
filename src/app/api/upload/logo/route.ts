import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Logo upload disabled — feature removed' },
    { status: 410 }
  );
}