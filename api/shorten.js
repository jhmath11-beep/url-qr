const { getLink, setLink, hasKv } = require("./_storage");

const CODE_PATTERN = /^[a-zA-Z0-9가-힣_-]{2,40}$/;

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}

function getOrigin(req) {
  const protocol = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${protocol}://${host}`;
}

function normalizeUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const url = new URL(withProtocol);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("http 또는 https 주소만 사용할 수 있습니다.");
  }
  return url.toString();
}

function randomCode(length = 6) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < length; i += 1) {
    result += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return result;
}

async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 100_000) {
        reject(new Error("요청 내용이 너무 큽니다."));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error("요청 형식이 올바르지 않습니다."));
      }
    });
    req.on("error", reject);
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "POST 요청만 사용할 수 있습니다." });
    return;
  }

  try {
    const body = await readBody(req);
    const originalUrl = normalizeUrl(body.url);
    let code = String(body.custom_code || "").trim();

    if (!originalUrl) {
      sendJson(res, 400, { error: "원본 URL을 입력해주세요." });
      return;
    }

    if (code && !CODE_PATTERN.test(code)) {
      sendJson(res, 400, { error: "별칭은 2~40자의 한글, 영문, 숫자, -, _만 사용할 수 있습니다." });
      return;
    }

    if (!code) {
      do {
        code = randomCode(6);
      } while (await getLink(code));
    } else if (await getLink(code)) {
      sendJson(res, 409, { error: "이미 사용 중인 별칭입니다. 다른 별칭을 입력해주세요." });
      return;
    }

    const stored = {
      url: originalUrl,
      code,
      title: String(body.title || "").trim().slice(0, 80),
      created_at: new Date().toISOString()
    };
    const storage = await setLink(code, stored);
    const shortUrl = `${getOrigin(req)}/s/${encodeURIComponent(code)}`;

    sendJson(res, 200, {
      short_url: shortUrl,
      code,
      original_url: originalUrl,
      storage,
      persistent: hasKv()
    });
  } catch (error) {
    sendJson(res, 400, { error: error.message || "단축 URL 생성에 실패했습니다." });
  }
};
