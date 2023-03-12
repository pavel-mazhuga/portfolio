# Next.js Boilerplate

## Требования

-   [Node.js](https://nodejs.org/en/) версии 16. С нодой автоматически ставится пакетный менеджер - [NPM](https://www.npmjs.com/). Проверить версию ноды можно командой **node -v**.
-   Для сабсеттинга шрифтов:
    -   [Python](https://www.python.org/)
    -   [Fonttools](https://github.com/fonttools/fonttools): **pip install fonttools**
    -   Brotli: **pip install brotli**

## Как начать работу

1. Создайте [новый проект на гитлабе](https://gitlab.com/projects/new). Если проект уже существует, пропустите шаги 1-5.
2. Склонируйте данный репозиторий на ваше локальное окружение: `git@gitlab.com:chipsadesign/next-boilerplate.git`, затем перейдите в созданную директорию.
3. Удалите папку .git: **rm -rf .git**.
4. Реинициализируйте git-репозиторий: **git init**.
5. Установите remote url: **git remote add origin [new_url_here]**.
6. Установите npm-зависимости: `npm i`.
7. Запустите команду `npm run dev` (или `npm run watch`).
8. Перейдите по адресу [http://localhost:3000](http://localhost:3000) в браузере.

Если произошла ошибка - не пугаемся, смотрим на ошибку, выясняем, в чем проблема, гуглим решение или спрашиваем у коллег.

Список всех npm-пакетов можно посмотреть в файле **package.json**.

## Обзор комманд

-   `npm run dev` (`npm run watch`) — watch в development-режиме;
-   `npm run build` — сборка в production-режиме;
-   `npm test` — запуск unit-тестов;
-   `npm test:ci` — запуск unit-тестов в CI-окружении;
-   `npm test:general` — запуск базовых e2e-тестов;
-   `npm test:lh` — запуск тестов производительности страниц (измеряется через [lighthouse](https://github.com/GoogleChrome/lighthouse));
-   `npm run storybook` — запуск storybook (dev);
-   `npm run test-storybook` — запуск тестов storybook;
-   `npm run build-storybook` — build storybook;
-   `npm run lint` — запуск линтеров;
-   `npm run format` — форматирование файлов через [prettier](https://prettier.io/);
-   `npm run ba` - анализ результирующего js-бандла. См. (webpack-bundle-analyzer)[https://github.com/webpack-contrib/webpack-bundle-analyzer].
-   `npm run subsetting` — сабсеттинг шрифтов (удаляются неиспользуемые глифы, значительно уменьшается размер шрифта).

## Структура frontend-приложения

-   `app`
    Файловый роутинг Некста. [Документация](https://beta.nextjs.org/docs/routing/fundamentals).
-   `atoms`
    Атомы глобального состояния (см. [Recoil.js](https://recoiljs.org/)).
-   `components`
    React-компоненты.
-   `css`
    Используется препроцессор [SCSS](https://sass-scss.ru/). Точка входа - **app.scss**.
-   `fonts`
    Шрифты.
-   `hooks`
    Кастомные хуки.
-   `stories`
    Истории, которые не относятся к компонентам.
-   `svg`
    SVG-файлы.
-   `utils`
    утилиты
-   `types.ts`
    Глобальные типы приложения.
-   `typograf.ts`
    Инстанс типографа.

## UI kit

Для ведения UI-kit проекта используется [Storybook](https://storybook.js.org/).
Чтобы запустить storybook, введите в консоли `npm run storybook`.

## Тесты

В качестве тест-раннера используется [Jest](https://jestjs.io/). Библиотека для тестирования - [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/).

##  Типограф

На проекте настроен типограф: поддерживаются русский и английский языки.
Используется так:

```tsx
import { tp } from '@/typograf';

const SomeComponent = () => <p>{tp('Эта строка будет тирографирована')}</p>;
```

## Узнать больше

-   [Документация Next.js](https://nextjs.org/docs)
-   [Learn Next.js](https://nextjs.org/learn) - интерактивный туториал по Next.js.
