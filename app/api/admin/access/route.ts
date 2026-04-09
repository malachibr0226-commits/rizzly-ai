import { NextResponse } from "next/server";
import { getServerUser, requireAuth } from "@/lib/auth";
import {
  getEffectiveAccess,
  removeAccessEmail,
  updateAccessEmail,
} from "@/lib/admin-store";
import { rateLimit } from "@/lib/rate-limit";
import { ensureTrustedOrigin } from "@/lib/security";

async function getAuthorizedUser() {
  const userId = await requireAuth();
  const user = await getServerUser();
  return { userId, user };
}

export async function GET(req: Request) {
  const { userId, user } = await getAuthorizedUser();

  if (!userId) {
    return NextResponse.json({ allowed: false, currentUserEmail: null }, { status: 401 });
  }

  const { limited, remaining } = rateLimit(req);
  if (limited) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429, headers: { "X-RateLimit-Remaining": String(remaining) } },
    );
  }

  const access = await getEffectiveAccess(user?.email);

  if (!access.isAdmin) {
    return NextResponse.json(
      {
        allowed: false,
        currentUserEmail: user?.email ?? null,
      },
      {
        headers: {
          "X-RateLimit-Remaining": String(remaining),
        },
      },
    );
  }

  return NextResponse.json(
    {
      allowed: true,
      currentUserEmail: user?.email ?? null,
      admins: access.admins,
      proEmails: access.proEmails,
      metrics: access.metrics,
      updatedAt: access.updatedAt,
    },
    {
      headers: {
        "X-RateLimit-Remaining": String(remaining),
      },
    },
  );
}

export async function POST(req: Request) {
  const blockedOrigin = ensureTrustedOrigin(req);
  if (blockedOrigin) {
    return blockedOrigin;
  }

  const { userId, user } = await getAuthorizedUser();

  if (!userId) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { limited, remaining } = rateLimit(req);
  if (limited) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429, headers: { "X-RateLimit-Remaining": String(remaining) } },
    );
  }

  const access = await getEffectiveAccess(user?.email);
  if (!access.isAdmin) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  try {
    const body = (await req.json()) as {
      email?: string;
      grantAdmin?: boolean;
      grantPro?: boolean;
    };

    const snapshot = await updateAccessEmail(body.email ?? "", {
      grantAdmin: Boolean(body.grantAdmin),
      grantPro: Boolean(body.grantPro),
    });

    return NextResponse.json(
      {
        allowed: true,
        currentUserEmail: user?.email ?? null,
        admins: snapshot.admins,
        proEmails: snapshot.proEmails,
        metrics: snapshot.metrics,
        updatedAt: snapshot.updatedAt,
      },
      {
        headers: {
          "X-RateLimit-Remaining": String(remaining),
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update access." },
      { status: 400, headers: { "X-RateLimit-Remaining": String(remaining) } },
    );
  }
}

export async function DELETE(req: Request) {
  const blockedOrigin = ensureTrustedOrigin(req);
  if (blockedOrigin) {
    return blockedOrigin;
  }

  const { userId, user } = await getAuthorizedUser();

  if (!userId) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { limited, remaining } = rateLimit(req);
  if (limited) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429, headers: { "X-RateLimit-Remaining": String(remaining) } },
    );
  }

  const access = await getEffectiveAccess(user?.email);
  if (!access.isAdmin) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  try {
    const body = (await req.json()) as {
      email?: string;
      remove?: "admin" | "pro" | "all";
    };

    const snapshot = await removeAccessEmail(body.email ?? "", body.remove ?? "all");

    return NextResponse.json(
      {
        allowed: true,
        currentUserEmail: user?.email ?? null,
        admins: snapshot.admins,
        proEmails: snapshot.proEmails,
        metrics: snapshot.metrics,
        updatedAt: snapshot.updatedAt,
      },
      {
        headers: {
          "X-RateLimit-Remaining": String(remaining),
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to remove access." },
      { status: 400, headers: { "X-RateLimit-Remaining": String(remaining) } },
    );
  }
}
