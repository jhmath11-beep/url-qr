const { EventEmitter } = require("events");
const shorten = require("./api/shorten");
const redirect = require("./api/redirect");

function mockRes() {
  return {
    statusCode: 200,
    headers: {},
    body: "",
    setHeader(key, value) {
      this.headers[key.toLowerCase()] = value;
    },
    end(data = "") {
      this.body += data;
      this.done = true;
    }
  };
}

async function main() {
  const code = `notice-${Date.now()}`;
  const req = new EventEmitter();
  req.method = "POST";
  req.headers = { host: "example.com", "x-forwarded-proto": "https" };
  req.body = {
    url: "https://www.metan.ms.kr",
    custom_code: code,
    title: "테스트"
  };
  const res = mockRes();
  await shorten(req, res);
  const created = JSON.parse(res.body);

  const redirectReq = { query: { code }, headers: {} };
  const redirectRes = mockRes();
  await redirect(redirectReq, redirectRes);

  console.log(JSON.stringify({
    createdStatus: res.statusCode,
    shortUrl: created.short_url,
    storage: created.storage,
    persistent: created.persistent,
    redirectStatus: redirectRes.statusCode,
    redirectLocation: redirectRes.headers.location
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
