import { NextRequest, NextResponse } from "next/server";
import { readDB, writeDB, logActivity } from "@/app/lib/db";
import { User } from "@/types";

export async function GET() {
  try {
    const db = readDB();
    return NextResponse.json({
      users: db.users,
      currentUser: db.currentUser
    });
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userData = typeof body === "string" ? JSON.parse(body) : body;

    if (!userData || !userData.email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const db = readDB();
    const existingUser = db.users.find(u => u.email.toLowerCase() === userData.email.toLowerCase().trim());
    if (existingUser) {
      return NextResponse.json(existingUser, { status: 200 });
    }

    const newId = db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1;

    const newUser: User = {
      id: newId,
      name: userData.name || "New User",
      email: userData.email.trim(),
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    writeDB(db);

    logActivity(`Created user profile "${newUser.name}"`, "user", newUser.id);

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("POST /api/users error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
