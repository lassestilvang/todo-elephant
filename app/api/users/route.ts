import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const users: any[] = [];

export async function GET(request: NextRequest) {
  return NextResponse.json({ users, currentUser: null });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const newUser = {
    id: Date.now(),
    name: body.name,
    email: body.email,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  return NextResponse.json(newUser, { status: 201 });
}