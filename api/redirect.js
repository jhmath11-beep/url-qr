const { getLink } = require("./_storage");

module.exports = async function handler(req, res) {
  const rawCode = req.query?.code || "";
  const code = Array.isArray(rawCode) ? rawCode[0] : rawCode;
  const item = await getLink(decodeURIComponent(code));

  if (!item) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(`<!doctype html>
<html lang="ko">
<head><meta charset="utf-8"><title>링크를 찾을 수 없습니다</title></head>
<body style="font-family: system-ui, sans-serif; padding: 40px;">
  <h1>링크를 찾을 수 없습니다.</h1>
  <p>주소가 잘못되었거나 저장소에 등록되지 않은 단축 코드입니다.</p>
  <a href="/">처음으로 돌아가기</a>
</body>
</html>`);
    return;
  }

  res.statusCode = 307;
  res.setHeader("Location", item.url);
  res.setHeader("Cache-Control", "no-store");
  res.end();
};
