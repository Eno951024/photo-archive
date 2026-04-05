# photo-archive

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

## CI/CD 파이프라인

### 자동 배포 규칙

- **develop 브랜치**: 커밋이 푸시되면 자동으로 린트 검증 및 빌드 검증 후 Docker Hub에 이미지가 푸시됩니다.
  - 이미지 태그: `dev-{파이프라인번호}` (예: `dev-42`, `dev-43`)

- **main/master 브랜치**: 커밋이 푸시되면 린트 검증 및 빌드 검증만 수행됩니다.

- **태그 푸시**: `v*` 형식의 태그(예: `v1.0.0`, `v2.0.0-beta`)를 푸시하면 CI/CD 파이프라인이 트리거되어 이미지를 빌드하고 Docker Hub에 푸시합니다.
  - 이미지 태그: 푸시한 태그 값 그대로 (예: `v1.0.0`)

### 배포 예시

```bash
# develop 브랜치에 커밋
git add .
git commit -m "기능 추가"
git push origin develop
# → 자동으로 dev-{번호} 태그로 Docker Hub에 배포

# 릴리스 태그 푸시
git tag v1.0.0
git push origin v1.0.0
# → 자동으로 v1.0.0 태그로 Docker Hub에 배포
```

### 멀티 아키텍처 지원

Docker 이미지는 다음 플랫폼을 지원합니다:
- `linux/amd64` - Intel/AMD 서버
- `linux/arm64` - Apple Silicon, ARM 서버
