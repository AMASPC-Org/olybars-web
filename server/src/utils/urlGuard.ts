import { URL } from "url";
import dns from "dns";
import { promisify } from "util";
// Private IP Ranges (RFC 1918 + basic local)

const lookup = promisify(dns.lookup);

const ALLOWED_PROTOCOLS = ["http:", "https:"];
const ALLOWED_PORTS = [80, 443];

// Private IP Ranges (RFC 1918 + basic local)
const PRIVATE_RANGES = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^0\./,
  /^169\.254\./,
  /^::1$/,
  /^[fF][cCdD]/, // Unique Local IPv6
  /^[fF][eE][89aAbB]/, // Link-local IPv6
];

export async function validateUrl(inputUrl: string): Promise<string> {
  let parsed: URL;
  try {
    parsed = new URL(inputUrl);
  } catch (e) {
    throw new Error("Invalid URL format");
  }

  if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
    throw new Error(`Protocol ${parsed.protocol} not allowed`);
  }

  // Port check
  if (parsed.port) {
    const port = parseInt(parsed.port, 10);
    if (!ALLOWED_PORTS.includes(port)) {
      throw new Error(`Port ${port} not allowed`);
    }
  }

  // Hostname DNS resolution loop (handle DNS rebinding potentially, but basic check first)
  const stats = await lookup(parsed.hostname);
  const resolvedIp = stats.address;

  // IP Blocklist
  if (isPrivateIp(resolvedIp)) {
    throw new Error(`Access into internal network denied: ${resolvedIp}`);
  }

  return inputUrl;
}

function isPrivateIp(addr: string): boolean {
  return PRIVATE_RANGES.some((regex) => regex.test(addr));
}
