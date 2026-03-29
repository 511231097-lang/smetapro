# Smetapro Frontend

![Coverage](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/511231097-lang/smetapro/badges/coverage.json)

Фронтенд приложения **Сметчик ПРО** на React + Rsbuild.

## Стек

- React 19
- Rsbuild / Rspack
- Mantine UI
- TanStack Query
- React Router
- Orval (генерация API-клиента)
- Biome (lint/format)
- Rstest + Testing Library (unit)
- Playwright (e2e)

## Требования

- Node.js 22.x
- npm 10+

## Быстрый старт

1. Установить зависимости:

```bash
npm ci
```

2. Создать локальный env (например, `.env.local`) и задать переменные:

```env
BASE_API_URL=http://localhost:4000
BASE_USER=...
BASE_PASS=...
```

3. Запустить проект:

```bash
npm run dev
```

Приложение поднимется на `http://localhost:4000`.

## Переменные окружения

- `BASE_API_URL` — базовый URL для HTTP-клиента (обязательная переменная).
- `BASE_USER` / `BASE_PASS` — Basic Auth для dev-proxy в `rsbuild.config.ts` (используется для проксирования `/api` на `https://dev.smetchik.pro`).
- `PW_BASE_URL` — базовый URL для Playwright (по умолчанию `http://127.0.0.1:4000`).

Если `BASE_API_URL` не задана, клиент бросит ошибку при запросах.

## Доступные команды

### Разработка

```bash
npm run dev        # dev-сервер (с открытием браузера)
npm run dev:test   # dev-сервер без автооткрытия
npm run build      # production build
npm run preview    # локальный preview build
```

### Качество кода

```bash
npm run lint       # biome check
npm run format     # biome format --write
npm run typecheck  # tsc --noEmit
npm run check      # biome check --write
```

### Тесты

```bash
npm run test               # rstest
npm run test:watch         # watch-режим
npm run test:unit          # unit-тесты (tests/**/*.test.tsx)
npm run test:unit:coverage # unit + coverage
npm run e2e                # Playwright e2e
npm run e2e:ui             # Playwright UI mode
```

### Storybook

```bash
npm run storybook
npm run build-storybook
```

### API-клиент

```bash
npm run api
```

Команда генерирует React Query клиент из `schema.yaml` в:

- `src/shared/api/generated/smetchik.ts`
- `src/shared/api/generated/schemas/*`

Сгенерированные файлы редактировать вручную не нужно.

## Структура проекта (кратко)

- `src/pages` — страницы приложения
- `src/layouts` — layout и route-guard компоненты
- `src/shared/api` — HTTP-клиент, query client, сгенерированный API
- `tests` — unit-тесты
- `e2e` — e2e-тесты Playwright
- `.github/workflows` — CI/CD пайплайны

## CI/CD

### PR Checks

В PR на `main` запускаются:

- `quality`: `lint` + `typecheck`
- `tests`: `test:unit:coverage` + комментарий с coverage
- `e2e`: Playwright тесты

### Deploy Dev

При push в `main`:

- сборка (`npm run build`)
- деплой `dist/` на dev-сервер через rsync

### Coverage Badge

При push в `main` обновляется badge в ветке `badges`.
