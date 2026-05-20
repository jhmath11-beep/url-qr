const { listLinks, hasKv } = require("./_storage");

const OWNER_CODE_PATTERN = /^[A-Z0-9-]{6,32}$/;

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

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    sendJson(res, 405, { error: "GET 요청만 사용할 수 있습니다." });
    return;
  }

  try {
    const ownerCode = String(req.query?.owner_code || "").trim().toUpperCase();
    if (!OWNER_CODE_PATTERN.test(ownerCode)) {
      sendJson(res, 400, { error: "관리 코드를 확인해주세요." });
      return;
    }

    const origin = getOrigin(req);
    const links = (await listLinks(ownerCode)).map((item) => ({
      code: item.code,
      title: item.title || "",
      original_url: item.url,
      short_url: `${origin}/s/${encodeURIComponent(item.code)}`,
      created_at: item.created_at
    }));

    sendJson(res, 200, {
      owner_code: ownerCode,
      links,
      persistent: hasKv()
    });
  } catch (error) {
    sendJson(res, 400, { error: error.message || "목록을 불러오지 못했습니다." });
  }
};
