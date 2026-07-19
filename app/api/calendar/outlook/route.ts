import { NextRequest, NextResponse } from "next/server";

const OUTLOOK_API_SCOPES = [
  "https://outlook.office.com/Calendars.ReadWrite",
  "offline_access"
];

const TOKENS_KEY = "elephant_outlook_tokens";

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
    // Redirect to Microsoft OAuth
    const authUrl = new URL("https://login.microsoftonline.com/common/oauth2/v2.0/authorize");
    authUrl.searchParams.set("client_id", process.env.OUTLOOK_CLIENT_ID || "");
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("redirect_uri", `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/outlook`);
    authUrl.searchParams.set("response_mode", "query");
    authUrl.searchParams.set("scope", OUTLOOK_API_SCOPES.join(" "));
    authUrl.searchParams.set("state", state || "");

    return NextResponse.redirect(authUrl.toString());
  }

  // Exchange authorization code for tokens
  try {
    const response = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.OUTLOOK_CLIENT_ID || "",
        scope: OUTLOOK_API_SCOPES.join(" "),
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/outlook`,
        grant_type: "authorization_code"
      })
    });

    const tokens = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: "OAuth failed" }, { status: 400 });
    }

    // Store tokens
    const storedToken = storeToken(tokens);

    return NextResponse.json({
      success: true,
      authenticated: true,
      message: "Outlook Calendar connected successfully!"
    });
  } catch (error) {
    console.error("Outlook OAuth error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}

// POST: Sync tasks to Outlook Calendar
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { task, shouldDelete = false } = body;

  if (!task && !shouldDelete) {
    return NextResponse.json({ error: "Task data required" }, { status: 400 });
  }

  try {
    // Get stored tokens
    const tokenJson = typeof window !== "undefined"
      ? localStorage.getItem("elephant_outlook_tokens")
      : null;

    if (!tokenJson) {
      return NextResponse.json({
        authenticated: false,
        message: "Please connect your Outlook Calendar first"
      });
    }

    const token = JSON.parse(tokenJson) as CalendarToken;

    // Create event in Outlook Calendar
    const event = {
      subject: task?.title || "Deleted Task",
      body: {
        contentType: "Text",
        content: task?.description || ""
      },
      start: {
        dateTime: task?.dueDate || new Date(Date.now() + 86400000).toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: task?.dueDate
          ? new Date(new Date(task.dueDate).getTime() + 3600000).toISOString()
          : new Date(Date.now() + 86400000 + 3600000).toISOString()
      },
      categories: [task?.priority === "high" ? "Important" : task?.priority === "medium" ? "Normal" : "Low"],
      singleValueExtendedProperties: [{
        id: "String {66f5a359-4659-4830-9070-00040ec6ac6e} Name TodoElephantId",
        value: task?.id?.toString() || "deleted"
      }]
    };

    const calendarResponse = await fetch(task && !shouldDelete
      ? "https://graph.microsoft.com/v1.0/me/calendar/events"
      : `https://graph.microsoft.com/v1.0/me/calendar/events/${body.eventId}`,
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
      // Handle token refresh if needed
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Outlook calendar sync error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}