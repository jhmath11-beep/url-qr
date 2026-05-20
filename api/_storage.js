const memoryStore = globalThis.__MAERAMAE_LINKS__ || new Map();
globalThis.__MAERAMAE_LINKS__ = memoryStore;

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
    return "vercel-kv";
  }
  memoryStore.set(code, value);
  return "memory";
}

module.exports = { getLink, setLink, hasKv };
