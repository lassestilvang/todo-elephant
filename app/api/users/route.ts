import { NextRequest, NextResponse } from "next/server";
import { readDB, mutateDB, logActivity, nextUserId } from "@/app/lib/db";
import { User } from "@/types";

export async function GET() {
  try {
    const db = await readDB();
    return NextResponse.json({ users: db.users, currentUser: db.currentUser });
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body?.email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    const user = await mutateDB<User>((db) => {
      const email = String(body.email).trim();
      const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (existing) return existing;
      const newUser: User = {
        id: nextUserId(db),
        name: body.name ?? "New User",
        email,
        createdAt: new Date().toISOString(),
      };
      db.users.push(newUser);
      return newUser;
    });
    await logActivity(`Created user profile "${user.name}"`, "user", user.id);
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("POST /api/users error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
