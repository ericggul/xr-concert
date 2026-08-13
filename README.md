# XR Concert

여러 관객의 모바일 입력을 하나의 공연 상태로 집계해 프로젝션 화면에 반영하고, 운영자가 전체 세션을 제어하는 XR 콘서트 시스템이다.

## 프로젝트 개요

이 시스템은 하나의 관리자 화면, 여러 대의 관객 모바일, 하나 이상의 프로젝션 화면, 그리고 이들을 연결하는 realtime relay로 구성된다.

```text
                         control data (Socket.IO / WSS)
┌────────────┐  session commands   ┌──────────────────┐  aggregate frame   ┌─────────────┐
│  /admin    │ ──────────────────► │ realtime relay   │ ────────────────► │  /screen    │
│ 운영자 화면 │                     │ 세션 상태·입력 집계 │                    │ 프로젝션 화면 │
└─────┬──────┘                     └────────▲─────────┘                    └─────────────┘
      │                                      │
      │ WebRTC audio                         │ gesture samples
      │ (one peer per listener)              │
      └──────────────────────────────► ┌──────┴──────┐ × N
                                      │  /mobile    │
                                      │ 관객 인터랙션 │
                                      └─────────────┘
```

- `/admin`: 공연 세션의 시작·일시정지·초기화, 실험 모드, 접속 인원, 관객 모바일 진입용 QR, 마이크 방송을 관리한다.
- `/mobile`: 각 관객의 터치 입력을 전송하고 즉각적인 로컬 피드백을 표시한다. 선택적으로 admin의 WebRTC 오디오를 수신한다.
- `/screen`: relay가 보낸 집계 프레임을 시각적으로 해석해 프로젝터에 렌더링한다. 개별 휴대폰 화면을 복제하지 않는다.
- `realtime relay`: 세션 상태의 기준점이다. 모바일 입력을 검증하고 최신 입력만 제한된 크기로 보관한 뒤 최대 30 Hz의 추상 집계 프레임으로 모든 screen에 전송한다. WebRTC에서는 offer·answer·ICE 시그널링만 중계하며 오디오 자체는 통과시키지 않는다.

현재 구현된 `wave-particle` 실험에서는 각 모바일이 최대 25 Hz로 터치 위치·압력·단계를 보내고, relay가 참여자 수·중심점·에너지·응집도·임펄스로 집계한다. `/screen`은 이 추상값을 입자와 파동으로 표현한다. 제어 데이터는 Socket.IO/WSS, 오디오는 admin과 각 listener 사이의 WebRTC P2P 연결을 사용한다.

웹 화면을 제공하는 Next.js 프로세스(`:10000`)와 상태 및 시그널링을 담당하는 relay(`:10001`)는 별도 프로세스다. 로컬 실행 명령은 둘을 함께 기동하지만, 배포와 장애 경계는 서로 분리되어 있다.

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

저장소를 받은 상위 폴더에서 웹앱 폴더로 이동한다.

```bash
cd nrf-xr/webapp
```

프로젝트가 요구하는 Node.js와 pnpm 버전을 준비한 다음 패키지를 설치한다. Node 26부터는 Corepack이 기본 포함되지 않으므로, 이 프로젝트가 고정한 pnpm 버전을 npm으로 설치한다.

```bash
nvm install 26.5.1
nvm use 26.5.1
npm install --global pnpm@10.34.0
pnpm install
cp .env.example .env
```

`nvm: command not found`가 나오면 [nvm](https://github.com/nvm-sh/nvm)을 먼저 설치하고 새 Terminal을 연다. `pnpm install`과 `.env` 복사는 최초 한 번만 하면 된다.

### 매번 앱 켜기

이후에는 저장소를 둔 상위 폴더에서 다음 세 줄만 실행한다.

```bash
cd nrf-xr/webapp
nvm use
pnpm dev
```

Terminal에 서버가 준비됐다는 주소가 출력되면 창을 닫지 말고 유지한다. 출력된 `Web app` 주소 뒤에 각 경로를 붙여 화면을 연다. 호스트명은 Mac마다 다르므로 아래의 `<Mac의-LocalHostName>.local`을 실제 출력값으로 바꾼다.

- 관리자 노트북: `https://<Mac의-LocalHostName>.local:10000/admin`
- 관객 휴대폰: `https://<Mac의-LocalHostName>.local:10000/mobile`
- 프로젝터 화면: `https://<Mac의-LocalHostName>.local:10000/screen`

`/admin`에서 세션을 시작하고, `/screen`을 프로젝터에 전체 화면으로 띄운 뒤, 휴대폰에서 `/mobile`에 접속하면 된다. 오디오 방송은 admin의 입력 장치를 선택하고 level meter가 움직이는지 확인한 다음 시작한다.

Mac의 원래 `LocalHostName`은 다음 명령으로 확인할 수 있다. 실제 접속에는 `pnpm dev`가 인증서와 함께 출력한 소문자 `.local` 주소를 우선 사용한다.

```bash
scutil --get LocalHostName
```

### 휴대폰 최초 연결

휴대폰과 MacBook을 같은 Wi-Fi에 연결한다. 휴대폰에서 Terminal에 출력된 `Mobile certificate` 주소를 열어 개발 인증서를 설치·신뢰한 다음, 출력된 Web app 주소의 `/mobile`을 연다. iPhone의 상세 인증서 설치 순서는 [`webapp/README.md`](./webapp/README.md#first-phone-setup)에 있다.

### 종료하기

서버가 실행 중인 Terminal에서 `Control + C`를 누르면 웹앱과 realtime relay가 함께 종료된다.

문제가 있으면 먼저 다음을 확인한다.

- 휴대폰 URL이 `localhost`가 아니라 `pnpm dev`가 출력한 해당 Mac의 `.local` 주소인지
- 모든 기기가 같은 Wi-Fi인지
- `pnpm dev` Terminal이 계속 실행 중인지
- 휴대폰이 인증서를 신뢰했는지

## Vercel boundary

The Next.js application can be deployed from this repository as an independent Vercel project with these settings:

- **Root Directory**: `webapp`
- **Framework Preset**: Next.js
- **Node.js Version**: `24.x`
- **Install Command / Build Command**: use Vercel's automatic detection; do not add a custom override

Local development is pinned to Node `26.5.1`, while `package.json#engines.node` accepts `24.x || 26.x`. Vercel therefore runs the supported Node 24 major, and other development machines select the exact local version from `.nvmrc` or `.node-version`. `packageManager` pins pnpm `10.34.0`, a major supported by Vercel, and `pnpm-lock.yaml` is committed for reproducible installs.

The current `webapp/realtime-server.mjs` is a stateful, long-running Socket.IO process. It is not part of the Next.js Vercel build and should be deployed to a persistent Node runtime or redesigned around durable shared state before a Vercel-native realtime deployment. Configure the deployed frontend with `NEXT_PUBLIC_REALTIME_URL=https://<relay-domain>`.

Local TLS certificates, `.env` files, generated output, dependencies, and machine-local agent settings are ignored at the repository root.
