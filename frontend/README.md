# Astro Boilerplate

## Requirements

- [Node.js](https://nodejs.org/en/) version 22+. You can check the installed version with **node -v**.
- [pnpm](https://pnpm.io/)

## Commands Overview

- `pnpm dev` (or `pnpm watch`) — watch in development mode;
- `pnpm build` — build for production;
- `pnpm test` — run unit tests;
- `pnpm test:ci` — run unit tests in CI environment;
- `pnpm test:general` — run basic e2e tests;
- `pnpm tsc` — run typescript type checking;
- `pnpm lint` — run linters;
- `pnpm pc` — run typescript type checking + linters;
- `pnpm format` — format files using [prettier](https://prettier.io/);
- `pnpm icons` - generate icon types;

## Frontend Application Structure

The project follows the Feature-Sliced Design methodology ([documentation](https://feature-sliced.design/)).

- `src/app`
  Application composition layer. Contains providers, routing, and global styles.
- `src/views`
  Application pages layer. Each page is a composition of widgets, features, and entities.
- `src/widgets`
  Independent and complete blocks for pages (header, footer, sidebar, etc.).
- `src/features`
  User interactions, actions that bring business value to the user.
- `src/entities`
  Application business entities (user, product, order, etc.).
- `src/shared`
  Reusable code not specific to the application:
    - `ui` - UI-kit components
    - `api` - API services
    - `config` - configuration
    - `lib` - helper libraries
    - `types` - global types
    - `utils` - utilities

## Typograf

The project has a typograf configured, supporting both Russian and English languages.
Usage:

```tsx
import { tp } from '@/shared/lib/formatting';

const typografedText = tp('This string will be typografed');
```

The second argument of the function is `locale`:

```tsx
import { tp } from '@/shared/lib/formatting';

const typografedText = tp(
    'This string will be typografed following Russian typography rules (default behavior)',
    'ru',
);
```

```tsx
import { tp } from '@/shared/lib/formatting';

const typografedText = tp('This string will be typografed following English typography rules', 'en');
```

## Seo

The project includes a component that adds JSON-LD structured data for search engines, located at `src/shared/lib/seo/JsonLd.astro`. Example below:

```astro
---
import { JsonLd } from '@/shared/lib/seo';

type Props = {
    product: {
        name: string;
        image: string[];
        description: string;
        brand: string;
        currency: string;
        price: string;
    };
};

const { product } = Astro.props;

const jsonLdData = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    image: product.image,
    description: product.description,
    brand: {
        '@type': 'Brand',
        name: product.brand,
    },
    offers: {
        '@type': 'Offer',
        priceCurrency: product.currency,
        price: product.price,
        availability: 'https://schema.org/InStock',
        url: Astro.url.href,
    },
};
---

<JsonLd data={jsonLdData} />

<div>
    <h1>{product.name}</h1>
    <img src={product.image[0]} alt={product.name} />
    <p>{product.description}</p>
</div>
```

## vh() functions in CSS - Fixing browser jumps

### Problem

If height is set in `svh/dvh/lvh/vh`, Telegram takes a long time to recalculate the block height, which leads to jumps within the page during scrolling.

### Solution

- Added a new function that identifies whether the user is browsing from the Telegram in-app browser.
- Use the `vh(value)` mixin function instead of standard `svh/dvh/lvh/vh` units. If the user is on the Telegram browser, the calculated unit `vh * value` will be used.

### Example

```scss
.first-block {
    height: vh(100, 1dvh);
}
```

- `height: vh(100)` means that in mobile browsers, the block will take the maximum screen height (ignoring control panels and the search bar).
- `1dvh` will be the fallback if `--mobile-vh` is not defined (only when browsing from a regular browser).
- This introduces a problem: if some content must be stuck to the bottom of the screen, it might be covered by the search bar or control panel. The `--mobile-difference-minvh-vh` CSS variable handles this — it represents the difference between the maximum and minimum screen height, which can be used to offset the content.
