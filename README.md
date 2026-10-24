# CKEditor 5 Elements

Element-level features for CKEditor 5 v49: commands that act on an element, an element context menu, clipboard
commands and actions (move, duplicate, delete) and attributes for elements, a JSON element schema, selectable elements, element toolbars, clickable elements, quick insert and breadcrumbs.

**[Try the full example](https://ivankild.github.io/ckeditor5-elements/example)**: an editor with all the features
together. Its source is in [`packages/ckeditor5-elements-example`](packages/ckeditor5-elements-example).

```sh
npm install ckeditor5 ckeditor5-elements
```

```ts
import { Breadcrumbs, ElementClipboard, ElementContextMenu, QuickInsert } from 'ckeditor5-elements';
import 'ckeditor5-elements/index.css';
```

See [`ckeditor5-elements`](packages/ckeditor5-elements) and the [documentation](https://ivankild.github.io/ckeditor5-elements/), with live examples and the API
reference (its source is in [`docs`](docs)).

## Packages

As `ckeditor5` is for CKEditor, [`ckeditor5-elements`](packages/ckeditor5-elements) is the package to install: it
re-exports the feature packages, which are published too, all in the same version, and combines their styles.

| Package                                                                       | Contents                                                                   | Depends on                                                          |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| [`ckeditor5-elements`](packages/ckeditor5-elements)                           | Everything below, and one stylesheet                                       | all below, in the same version                                      |
| [`ckeditor5-elements-core`](packages/ckeditor5-elements-core)                 | Element commands, their button views, and the `ElementMenu` plugin         | –                                                                   |
| [`ckeditor5-elements-clipboard`](packages/ckeditor5-elements-clipboard)       | Copy, cut, paste (before/after) commands for an element                    | `ckeditor5-elements-core`                                           |
| [`ckeditor5-elements-actions`](packages/ckeditor5-elements-actions)           | Move up/down, duplicate and delete commands for an element                 | `ckeditor5-elements-core`                                           |
| [`ckeditor5-elements-attributes`](packages/ckeditor5-elements-attributes)     | Show the attributes of an element in a modal                               | `ckeditor5-elements-core`                                           |
| [`ckeditor5-elements-schema`](packages/ckeditor5-elements-schema)             | Declare elements from a JSON file, with validation, and their commands     | `ckeditor5-elements-core`                                           |
| [`ckeditor5-elements-toolbar`](packages/ckeditor5-elements-toolbar)           | Floating toolbars for elements, by name or filter                          | `ckeditor5-elements-core`                                           |
| [`ckeditor5-elements-selectable`](packages/ckeditor5-elements-selectable)     | Select an element as a whole by a click or the arrow keys, no widgets      | `ckeditor5-elements-core`                                           |
| [`ckeditor5-elements-clickable`](packages/ckeditor5-elements-clickable)       | Click and double click on elements, by name or filter                      | `ckeditor5-elements-core`                                           |
| [`ckeditor5-elements-context-menu`](packages/ckeditor5-elements-context-menu) | Element context menu: commands, submenus, separators                       | `ckeditor5-elements-core`                                           |
| [`ckeditor5-elements-quick-insert`](packages/ckeditor5-elements-quick-insert) | Alt+Enter quick insert; "insert before/after" commands for menus           | `ckeditor5-elements-core`                                           |
| [`ckeditor5-elements-breadcrumbs`](packages/ckeditor5-elements-breadcrumbs)   | Element path at the selection; clickable with a configured menu            | `ckeditor5-elements-core` (uses `ElementMenu` through an interface) |
| [`ckeditor5-elements-example`](packages/ckeditor5-elements-example)           | The full example: an editor with all the features (private, not published) | `ckeditor5-elements`                                                |
| [`docs`](docs)                                                                | Documentation: guides with live examples, and the API reference            |                                                                     |

The feature packages depend on each other in exact versions. Core fails to load twice, as CKEditor does
(`ckeditor-duplicated-modules`): two copies of it would mean two versions installed.

## Development

```sh
pnpm install
pnpm dev             # the documentation, with live examples (VitePress + TypeDoc)
pnpm example         # the full example, as a page of its own (Vite)
pnpm docs:build      # the static documentation site, in docs/.vitepress/dist
pnpm test            # tests, in headless Chrome
pnpm test:coverage   # tests with a coverage report in coverage/
pnpm check           # type check, lint, package consistency, format check and tests
pnpm smoke           # installs the packed packages into a new app, builds it and runs it in Chrome
pnpm version:set 49.0.0-alpha.2   # the version of all packages, which have the same one
```

The tests run in Vitest browser mode, with Playwright driving the installed Google Chrome. To use a Playwright-managed
Chromium instead, run `pnpm exec playwright install chromium` and set `PLAYWRIGHT_CHANNEL=chromium`.

CI (`.github/workflows/ci.yml`) runs `pnpm check` and `pnpm smoke` on every push to `main` and every pull request, with
the CKEditor version of the lockfile and with the newest one the packages allow (`^49.0.0`).

### Adding a package

Create `packages/<name>` (copy a small one, such as `ckeditor5-elements-actions`). The tools find it by itself: the
tests, the docs and the example use its sources, and TypeScript paths cover it. `pnpm lint:packages` tells what is left
to list, and fails until it is done: for a published feature, the dependency, the `tsconfig` reference and the export
of the umbrella package, and the reference in `tsconfig.packages.json`. It also checks that the features depend only
on the core, and that all packages have the same version and peer dependency.

## Layout

```
packages/<package>/
├── src/          # sources
├── tests/        # tests, mirroring src/
└── theme/        # styles, published as `<package>/index.css`
packages/ckeditor5-elements/
└── src/index.ts  # re-exports the feature packages; `pnpm build` combines their styles into dist/index.css
testUtils/        # helpers shared by the tests (editor setup, key presses, menu structure)
scripts/          # build, check and release scripts; packages.js lists the packages for the other tools
docs/             # VitePress site: guide/ pages, demos/ (live examples), api/ (generated by TypeDoc)
```

## Publishing

All packages have the same version, the CKEditor version they are built for with a pre-release suffix (e.g.
`49.0.0-alpha.0`). Release them together, from `main`, logged in to npm (`npm login`):

```sh
pnpm publish:all
```

pnpm replaces the `workspace:*` dependencies with the exact version. The packages are published with the `alpha`
dist-tag; change `--tag` in the `publish:all` script for other releases.

The documentation is published on [GitHub Pages](https://ivankild.github.io/ckeditor5-elements/) by the
[Docs workflow](.github/workflows/docs.yml) on every push to `main` (or when run by hand).
