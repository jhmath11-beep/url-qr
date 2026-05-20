# 매라매 URL 단축 & QR 서버형 앱

이 버전은 바탕화면 HTML 단독 실행이 아니라, 5long2 URL 단축 프로그램처럼 서버 API가 있는 구조입니다.

## 구조

- `public/index.html`: 사용자가 보는 화면
- `api/shorten.js`: 원본 URL을 저장하고 짧은 URL을 발급
- `api/redirect.js`: `/s/코드` 접속 시 원본 URL로 이동
- `vercel.json`: `/s/:code` 주소를 리다이렉트 API로 연결

## 배포

Vercel에 이 폴더를 프로젝트로 배포하면 됩니다.

운영용으로 계속 유지되는 단축 URL을 쓰려면 Vercel KV를 연결하고 아래 환경변수가 있어야 합니다.

- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

Vercel KV가 없으면 테스트용 임시 저장으로 동작합니다. 이 경우 서버가 재시작되면 저장된 단축 URL이 사라질 수 있습니다.

## 주소 형태

배포 주소가 `https://example.com`이면 단축 URL은 아래처럼 생성됩니다.

```txt
https://example.com/s/notice
```

도메인을 연결하면 단축 URL의 시작 주소도 자동으로 연결한 도메인으로 바뀝니다.
