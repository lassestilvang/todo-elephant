import { NextRequest, NextResponse } from "next/server";

const GOOGLE_API_SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/tasklists"
];

const TOKENS_KEY = "elephant_calendar_tokens";

interface CalendarToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

function storeToken(tokenData: any): CalendarToken {
  const token: CalendarToken = {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresAt: Date.now() + tokenData.expires_in * 1000
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKENS_KEY, JSON.stringify(token));
  }
  return token;
}

// GET: OAuth2 callback
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code) {
    // Redirect to Google OAuth
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID || "");
    authUrl.searchParams.set("redirect_uri", `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/google`);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", GOOGLE_API_SCOPES.join(" "));
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");
    authUrl.searchParams.set("state", state || "");

    return NextResponse.redirect(authUrl.toString());
  }

  // Exchange authorization code for tokens
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/google`,
        grant_type: "authorization_code"
      })
    });

    const tokens = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: "OAuth failed" }, { status: 400 });
    }

    // Store tokens (in production, use secure database/session)
    const storedToken = storeToken(tokens);

    return NextResponse.json({
      success: true,
      authenticated: true,
      message: "Google Calendar connected successfully!"
    });
  } catch (error) {
    console.error("Google OAuth error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}

// POST: Sync tasks to Google Calendar
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { task, delete: shouldDelete = false } = body;

  if (!task && !shouldDelete) {
    return NextResponse.json({ error: "Task data required" }, { status: 400 });
  }

  try {
    // Get stored tokens
    const tokenJson = typeof window !== "undefined"
      ? localStorage.getItem("elephant_calendar_tokens")
      : null;

    if (!tokenJson) {
      return NextResponse.json({
        authenticated: false,
        message: "Please connect your Google Calendar first"
      });
    }

    const token = JSON.parse(tokenJson) as CalendarToken;

    // Create event in Google Calendar
    const event = {
      summary: task?.title || "Deleted Task",
      description: task?.description || "",
      start: {
        dateTime: task?.dueDate || new Date(Date.now() + 86400000).toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: task?.dueDate
          ? new Date(new Date(task.dueDate).getTime() + 3600000).toISOString()
          : new Date(Date.now() + 86400000 + 3600000).toISOString()
      },
      extendedProperties: {
        private: {
          todoElephantId: task?.id?.toString() || "deleted",
          priority: task?.priority || "medium"
        }
      },
      transparency: task?.priority === "high" ? "opaque" : "transparent"
    };

    const calendarResponse = await fetch(task && !shouldDelete
      ? "https://www.googleapis.com/calendar/v3/calendars/primary/events"
      : `https://www.googleapis.com/calendar/v3/calendars/primary/events/${body.eventId}`,
      {
        method: shouldDelete ? "DELETE" : "POST",
        headers: {
          "Authorization": `Bearer ${token.accessToken}`,
          "Content-Type": "application/json"
        },
        body: shouldDelete ? undefined : JSON.stringify(event)
      }
    );

    if (!calendarResponse.ok) {
      const errorData = await calendarResponse.json();
      // Token might be expired, try refresh
      if (calendarResponse.status === 401 && token.refreshToken) {
        const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID || "",
            client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
            refresh_token: token.refreshToken,
            grant_type: "refresh_token"
          })
        });
        const newTokens = await refreshResponse.json();
        if (newTokens.access_token) {
          const newToken = { ...token, accessToken: newTokens.access_token };
          localStorage.setItem("elephant_calendar_tokens", JSON.stringify(newToken));
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Calendar sync error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}