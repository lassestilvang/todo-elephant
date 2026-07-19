import { NextRequest, NextResponse } from "next/server";
import { verifyToken, TokenPayload } from "@/src/lib/auth";

export interface AuthenticatedRequest extends NextRequest {
  user: TokenPayload;
}

/**
 * Authentication middleware for API routes
 * Usage: export const GET = withAuth(async (req) => { ... })
 */
export function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid or expired token" },
        { status: 401 }
      );
    }

    // Attach user to request
    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = payload;

    return handler(authenticatedRequest);
  };
}

/**
 * Role-based authorization middleware
 * Usage: export const DELETE = withAuth(withRole("ADMIN")(async (req) => { ... }))
 */
export function withRole(...allowedRoles: string[]) {
  return function (
    handler: (req: AuthenticatedRequest) => Promise<NextResponse>
  ) {
    return async (request: AuthenticatedRequest) => {
      if (!allowedRoles.includes(request.user.role)) {
        return NextResponse.json(
          { error: "Forbidden - Insufficient permissions" },
          { status: 403 }
        );
      }
      return handler(request);
    };
  };
}

/**
 * Optional auth - attaches user if token exists but doesn't require it
 */
export function withOptionalAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const authHeader = request.headers.get("authorization");

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const payload = verifyToken(token);

      if (payload) {
        const authenticatedRequest = request as AuthenticatedRequest;
        authenticatedRequest.user = payload;
      }
    }

    return handler(request as AuthenticatedRequest);
  };
}

/**
 * Rate limiting middleware
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function withRateLimit(
  maxRequests: number = 100,
  windowMs: number = 60000
) {
  return function (
    handler: (req: NextRequest) => Promise<NextResponse>
  ) {
    return async (request: NextRequest) => {
      const ip = request.headers.get("x-forwarded-for") ||
                 request.headers.get("x-real-ip") ||
                 "unknown";
      const key = `ratelimit:${ip}`;
      const now = Date.now();

      const record = rateLimitStore.get(key);

      if (!record || now > record.resetTime) {
        rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      } else {
        record.count++;
        if (record.count > maxRequests) {
          return NextResponse.json(
            { error: "Too Many Requests" },
            {
              status: 429,
              headers: {
                "Retry-After": Math.ceil((record.resetTime - now) / 1000).toString(),
                "X-RateLimit-Limit": maxRequests.toString(),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": Math.ceil(record.resetTime / 1000).toString(),
              }
            }
          );
        }
      }

      const response = await handler(request);

      // Add rate limit headers
      const currentRecord = rateLimitStore.get(key);
      if (currentRecord) {
        response.headers.set("X-RateLimit-Limit", maxRequests.toString());
        response.headers.set("X-RateLimit-Remaining",
          (maxRequests - currentRecord.count).toString());
        response.headers.set("X-RateLimit-Reset",
          Math.ceil(currentRecord.resetTime / 1000).toString());
      }

      return response;
    };
  };
}

/**
 * Combine multiple middlewares
 */
export function composeMiddleware(...middlewares: Array<(handler: any) => any>) {
  return function (handler: any) {
    return middlewares.reduceRight((acc, mw) => mw(acc), handler);
  };
}

/**
 * CORS middleware
 */
export function withCors(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: {
    origin?: string | string[];
    methods?: string[];
    allowedHeaders?: string[];
  } = {}
) {
  const {
    origin = "*",
    methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders = ["Content-Type", "Authorization"],
  } = options;

  return async (request: NextRequest) => {
    // Handle preflight
    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": Array.isArray(origin) ? origin.join(", ") : origin,
          "Access-Control-Allow-Methods": methods.join(", "),
          "Access-Control-Allow-Headers": allowedHeaders.join(", "),
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    const response = await handler(request);

    response.headers.set("Access-Control-Allow-Origin",
      Array.isArray(origin) ? origin.join(", ") : origin);
    response.headers.set("Access-Control-Allow-Methods", methods.join(", "));
    response.headers.set("Access-Control-Allow-Headers", allowedHeaders.join(", "));

    return response;
  };
}