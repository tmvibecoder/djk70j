// Gemeinsame HMAC-Helfer für die Session-Cookies der drei Login-Bereiche
// (App `lib/auth.ts`, Werbebanden `lib/banden-auth.ts`, DJK-Info `lib/info-auth.ts`).
// Web-Crypto, läuft auch in der Edge-Middleware. Alle signieren mit AUTH_SECRET.
//
// SICHERHEITSKRITISCH: Die Payload-Formate der Bereiche sind bewusst paarweise
// verschieden — App `${userId}.${ts}`, Banden `banden-auth:${ts}`,
// Info `info-auth:${rolle}:${ts}`. Die Middleware prüft nur Signaturen (keine
// DB); allein die Domain-Trennung im Payload verhindert, dass ein kopierter
// Token eines Bereichs in einem anderen gültig ist. Payloads hier niemals
// vereinheitlichen oder umformatieren.

function getSecret(): string {
  const s = process.env.AUTH_SECRET
  if (!s) throw new Error('AUTH_SECRET ist nicht gesetzt (.env)')
  return s
}

function bytesToHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

function hexToBytes(hex: string): ArrayBuffer {
  const buf = new ArrayBuffer(hex.length / 2)
  const out = new Uint8Array(buf)
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return buf
}

export async function hmacSign(payload: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload))
  return bytesToHex(sig)
}

export async function hmacVerify(payload: string, sigHex: string): Promise<boolean> {
  const enc = new TextEncoder()
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(getSecret()),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    )
    return await crypto.subtle.verify('HMAC', key, hexToBytes(sigHex), enc.encode(payload))
  } catch {
    return false
  }
}
