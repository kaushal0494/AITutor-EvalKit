// lib/redis.ts
import { createClient, type RedisClientType } from "redis"

let client: RedisClientType | null = null

function flipScheme(url: string) {
    if (url.startsWith("rediss://")) return url.replace(/^rediss:\/\//, "redis://")
    if (url.startsWith("redis://")) return url.replace(/^redis:\/\//, "rediss://")
    return url
}

// errors that strongly indicate TLS mismatch
const TLS_MISMATCH_SNIPPETS = [
    "packet length too long",
    "WRONG_VERSION_NUMBER",
    "alert handshake failure",
    "unsupported protocol",
    "tls_get_more_records",
]

export async function getRedis(): Promise<RedisClientType> {
    if (client && client.isOpen) return client

    const raw = process.env.REDIS_URL
    if (!raw) throw new Error("REDIS_URL is not set")

    // 1) try with the URL as-is
    try {
        const c1 = createClient({ url: raw })
        c1.on("error", (e) => console.error("[redis] error:", e))
        await c1.connect()
        client = c1
        return c1
    } catch (e: any) {
        const msg = String(e?.message || e)
        const looksLikeTlsMismatch = TLS_MISMATCH_SNIPPETS.some((s) => msg.includes(s))
        if (!looksLikeTlsMismatch) {
            throw e
        }
        // 2) retry by flipping the scheme (redis <-> rediss)
        const alt = flipScheme(raw)
        const c2 = createClient({ url: alt })
        c2.on("error", (ee) => console.error("[redis] error:", ee))
        await c2.connect()
        client = c2
        return c2
    }
}
