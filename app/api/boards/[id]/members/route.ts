import { NextRequest, NextResponse } from 'next/server';
import { BoardModel } from '@/models/board.model';
import { UserModel } from '@/models/user.model';
import { verifyToken } from '@/lib/auth';
import { dbConnect } from '@/lib/db';

// POST /api/boards/[id]/members - Invite a member to a board
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.type !== 'access') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { email, permission = 'edit' } = body;

    // Validate permission level
    const validPermissions = ['view', 'edit', 'admin'];
    if (!validPermissions.includes(permission)) {
      return NextResponse.json(
        { error: 'Invalid permission level' },
        { status: 400 }
      );
    }

    // Find the board
    const board = await BoardModel.findById(id);
    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    // Check if the inviter has admin permission
    const inviter = board.members.find(m => m.userId === payload.userId);
    if (!inviter || inviter.permission !== 'admin') {
      return NextResponse.json({ error: 'Only admins can invite members' }, { status: 403 });
    }

    // Find the user to invite
    const userToInvite = await UserModel.findOne({ email });
    if (!userToInvite) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is already a member
    const existingMember = board.members.find(m => m.userId === userToInvite._id.toString());
    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 400 });
    }

    // Add the member
    board.members.push({
      userId: userToInvite._id.toString(),
      permission: permission as 'view' | 'edit' | 'admin'
    });

    await board.save();

    // Notify the invited user
    // (Would normally use a notification system or real-time event)

    return NextResponse.json({
      member: {
        userId: userToInvite._id.toString(),
        email: userToInvite.email,
        permission
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Invite member error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/boards/[id]/members - List board members
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.type !== 'access') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { id } = params;

    const board = await BoardModel.findById(id);
    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    // Check if user is a member
    const member = board.members.find(m => m.userId === payload.userId);
    if (!member) {
      return NextResponse.json({ error: 'Not a board member' }, { status: 403 });
    }

    // Get user details for all members
    const memberDetails = await Promise.all(
      board.members.map(async (m) => {
        const user = await UserModel.findById(m.userId).select('name email');
        return {
          userId: m.userId,
          name: user?.name || 'Unknown',
          email: user?.email || 'Unknown',
          permission: m.permission
        };
      })
    );

    return NextResponse.json({ members: memberDetails });
  } catch (error) {
    console.error('Get members error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}