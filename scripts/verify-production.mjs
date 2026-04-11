import { Resolver } from "node:dns/promises";
import { isIP } from "node:net";

const PUBLIC_DNS_SERVERS = ["1.1.1.1", "8.8.8.8"];
const canonicalUrl =
  process.env.RIZZLY_PRODUCTION_URL?.trim() ||
  process.env.NEXT_PUBLIC_APP_URL?.trim() ||
  "https://rizzlyai.com";

function isPrivateIpv4(ip) {
  const [first = 0, second = 0] = ip.split(".").map(Number);

  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}

function isPrivateIpv6(ip) {
  const normalized = ip.toLowerCase();

  return (
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb")
  );
}

function isPrivateIp(ip) {
  const version = isIP(ip);

  if (version === 4) {
    return isPrivateIpv4(ip);
  }

  if (version === 6) {
    return isPrivateIpv6(ip);
  }

  return true;
}

function logStep(message) {
  console.log(`• ${message}`);
}

function logPass(message) {
  console.log(`✔ ${message}`);
}

function logWarn(message) {
  console.warn(`⚠ ${message}`);
}

async function resolvePublicIps(hostname, { optional = false } = {}) {
  const found = new Set();

  for (const server of PUBLIC_DNS_SERVERS) {
    const resolver = new Resolver();
    resolver.setServers([server]);

    for (const lookup of [() => resolver.resolve4(hostname), () => resolver.resolve6(hostname)]) {
      try {
        const addresses = await lookup();

        for (const address of addresses) {
          found.add(address);
        }
      } catch {
        // Keep trying other record types/resolvers.
      }
    }
  }

  const addresses = [...found];

  if (addresses.length === 0) {
    if (optional) {
      logWarn(`No public DNS record found for ${hostname}`);
      return [];
    }

    throw new Error(`No public DNS record found for ${hostname}`);
  }

  const privateAddresses = addresses.filter(isPrivateIp);

  if (privateAddresses.length > 0) {
    throw new Error(
      `${hostname} resolves to private/internal IPs: ${privateAddresses.join(", ")}`,
    );
  }

  logPass(`${hostname} resolves publicly: ${addresses.join(", ")}`);
  return addresses;
}

async function assertHttpOk(url, label) {
  logStep(`Checking ${label}: ${url}`);

  const response = await fetch(url, {
    redirect: "follow",
    headers: {
      "user-agent": "rizzly-deploy-guard/1.0",
      accept: "application/json,text/html;q=0.9,*/*;q=0.8",
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`${label} returned ${response.status} ${response.statusText}`);
  }

  logPass(`${label} responded with ${response.status}`);
}

async function main() {
  const url = new URL(canonicalUrl);

  if (url.protocol !== "https:") {
    throw new Error(`Production URL must use https, received ${url.protocol}`);
  }

  logStep(`Verifying production deployment for ${url.origin}`);

  await resolvePublicIps(url.hostname);

  const optionalWwwHost = url.hostname.startsWith("www.")
    ? url.hostname.replace(/^www\./, "")
    : `www.${url.hostname}`;

  if (optionalWwwHost !== url.hostname) {
    await resolvePublicIps(optionalWwwHost, { optional: true });
  }

  await assertHttpOk(url.origin, "homepage");
  await assertHttpOk(new URL("/api/health", url).toString(), "health endpoint");

  logPass("All production checks passed.");
}

main().catch((error) => {
  console.error(`\n✖ Production verification failed: ${error.message}`);
  process.exitCode = 1;
});
