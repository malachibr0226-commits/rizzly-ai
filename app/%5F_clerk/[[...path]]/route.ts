import { createFrontendApiProxyHandlers } from "@clerk/nextjs/server";
import { CLERK_PROXY_PATH } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const { GET, POST, PUT, DELETE, PATCH } =
  createFrontendApiProxyHandlers({
    proxyPath: CLERK_PROXY_PATH,
  });
