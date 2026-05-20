const memoryStore = globalThis.__MAERAMAE_LINKS__ || new Map();
globalThis.__MAERAMAE_LINKS__ = memoryStore;
const memoryOwnerStore = globalThis.__MAERAMAE_OWNER_LINKS__ || new Map();
globalThis.__MAERAMAE_OWNER_LINKS__ = memoryOwnerStore;

function hasKv() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function kvRequest(path, init = {}) {
  const base = process.env.KV_REST_API_URL.replace(/\/$/, "");
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
      ...(init.headers || {})
    }
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`KV 저장소 오류: ${response.status} ${text}`);
  }
  return response.json();
}

async function getLink(code) {
  if (hasKv()) {
    const data = await kvRequest(`/get/maeramae:${encodeURIComponent(code)}`);
    return data.result ? JSON.parse(data.result) : null;
  }
  return memoryStore.get(code) || null;
}

async function setLink(code, value) {
  if (hasKv()) {
    await kvRequest(`/set/maeramae:${encodeURIComponent(code)}`, {
      method: "POST",
      body: JSON.stringify(value)
    });
    if (value.owner_code) {
      await kvRequest(`/sadd/maeramae-owner:${encodeURIComponent(value.owner_code)}/${encodeURIComponent(code)}`, {
        method: "POST"
      });
    }
    return "vercel-kv";
  }
  memoryStore.set(code, value);
  if (value.owner_code) {
    const ownerLinks = memoryOwnerStore.get(value.owner_code) || new Set();
    ownerLinks.add(code);
    memoryOwnerStore.set(value.owner_code, ownerLinks);
  }
  return "memory";
}

async function listLinks(ownerCode) {
  if (hasKv()) {
    const data = await kvRequest(`/smembers/maeramae-owner:${encodeURIComponent(ownerCode)}`);
    const codes = Array.isArray(data.result) ? data.result : [];
    const links = await Promise.all(codes.map((code) => getLink(code)));
    return links.filter(Boolean).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  }

  const codes = Array.from(memoryOwnerStore.get(ownerCode) || []);
  return codes
    .map((code) => memoryStore.get(code))
    .filter(Boolean)
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
}

module.exports = { getLink, setLink, listLinks, hasKv };
