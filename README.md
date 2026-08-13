# XR Concert

Root repository for the NRF XR concert system. Each runtime remains isolated so a failure or deployment decision in one surface does not force the other parts to move with it.

## Repository layout

```text
nrf-xr/
├── webapp/       Next.js admin, mobile, and screen surfaces plus realtime relay
└── broadcaster/  original broadcaster prototype retained as reference
```

The active application and its complete setup documentation live in [`webapp/README.md`](./webapp/README.md).

## 처음 실행하기

이 프로젝트는 MacBook에서 웹 서버를 실행하고, 같은 Wi-Fi의 노트북·프로젝터·휴대폰이 접속하는 구조다. 아래 명령은 macOS Terminal에서 실행한다.

### 최초 1회 설정

저장소를 받은 뒤 프로젝트 폴더로 이동한다.

```bash
cd /Users/jeongyoonchoi/Desktop/Side_Project/nrf-xr
cd webapp
```

프로젝트가 요구하는 Node.js와 pnpm 버전을 준비한 다음 패키지를 설치한다.

```bash
nvm install 26.5.1
nvm use 26.5.1
corepack enable
corepack prepare pnpm@11.17.0 --activate
pnpm install
cp .env.example .env
```

`nvm: command not found`가 나오면 [nvm](https://github.com/nvm-sh/nvm)을 먼저 설치하고 새 Terminal을 연다. `pnpm install`과 `.env` 복사는 최초 한 번만 하면 된다.

### 매번 앱 켜기

이후에는 다음 세 줄만 실행한다.

```bash
cd /Users/jeongyoonchoi/Desktop/Side_Project/nrf-xr/webapp
nvm use
pnpm dev
```

Terminal에 서버가 준비됐다는 주소가 출력되면 창을 닫지 말고 유지한다. 브라우저에서는 다음 화면을 연다.

- 관리자 노트북: `https://macbook-air-5.local:10000/admin`
- 관객 휴대폰: `https://macbook-air-5.local:10000/mobile`
- 프로젝터 화면: `https://macbook-air-5.local:10000/screen`

`/admin`에서 세션을 시작하고, `/screen`을 프로젝터에 전체 화면으로 띄운 뒤, 휴대폰에서 `/mobile`에 접속하면 된다. 오디오 방송은 admin의 입력 장치를 선택하고 level meter가 움직이는지 확인한 다음 시작한다.

### 휴대폰 최초 연결

휴대폰과 MacBook을 같은 Wi-Fi에 연결한다. 휴대폰에서 `https://macbook-air-5.local:10001/cert`를 열어 개발 인증서를 설치·신뢰한 다음 `/mobile`을 연다. iPhone의 상세 인증서 설치 순서는 [`webapp/README.md`](./webapp/README.md#first-phone-setup)에 있다.

### 종료하기

서버가 실행 중인 Terminal에서 `Control + C`를 누르면 웹앱과 realtime relay가 함께 종료된다.

문제가 있으면 먼저 다음을 확인한다.

- URL이 `localhost`가 아니라 `macbook-air-5.local`인지
- 모든 기기가 같은 Wi-Fi인지
- `pnpm dev` Terminal이 계속 실행 중인지
- 휴대폰이 인증서를 신뢰했는지

## Vercel boundary

The Next.js application can be deployed from this repository as an independent Vercel project by setting its **Root Directory** to `webapp`.

The current `webapp/realtime-server.mjs` is a stateful, long-running Socket.IO process. It is not part of the Next.js Vercel build and should be deployed to a persistent Node runtime or redesigned around durable shared state before a Vercel-native realtime deployment. Configure the deployed frontend with `NEXT_PUBLIC_REALTIME_URL=https://<relay-domain>`.

Local TLS certificates, `.env` files, generated output, dependencies, and machine-local agent settings are ignored at the repository root.
