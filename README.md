# CKEditor 5 Elements

Element-first editing for CKEditor 5 v49. The content is a tree of named elements, each with its attributes, declared
from a JSON schema, formatting included; the data mirrors the model, element for element. Every feature acts on an
element: commands and their buttons, the element menu and context menu, actions (move, duplicate, delete) and the
clipboard, attributes, selection and clicks, element toolbars, quick insert and breadcrumbs.

**[Try the full example](https://ivankild.github.io/ckeditor5-elements/examples/)**: an editor with all the features
together. Its source is in [`packages/ckeditor5-elements-example`](packages/ckeditor5-elements-example).

```sh
npm install ckeditor5 ckeditor5-elements
```

```ts
import { ElementBreadcrumbs, ElementClipboard, ElementContextMenu, ElementQuickInsert } from 'ckeditor5-elements';
import 'ckeditor5-elements/index.css';
```

See [`ckeditor5-elements`](packages/ckeditor5-elements) and the [documentation](https://ivankild.github.io/ckeditor5-elements/), with live examples and the API
reference (its source is in [`docs`](docs)).

## Packages

As `ckeditor5` is for CKEditor, [`ckeditor5-elements`](packages/ckeditor5-elements) is the package to install: it
re-exports the feature packages, which are published too, all in the same version, and combines their styles.

| Package                                                                             | Contents                                                                   | Depends on                     |
| ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------ |
| [`ckeditor5-elements`](packages/ckeditor5-elements)                                 | Everything below, and one stylesheet                                       | all below, in the same version |
| [`ckeditor5-elements-core`](packages/ckeditor5-elements-core)                       | Element commands and their button views                                    | –                              |
| [`ckeditor5-elements-actions`](packages/ckeditor5-elements-actions)                 | Move, duplicate and delete, copy, cut and paste commands for an element    | `ckeditor5-elements-core`      |
| [`ckeditor5-elements-attributes`](packages/ckeditor5-elements-attributes)           | Show the attributes of an element in a modal                               | `ckeditor5-elements-core`      |
| [`ckeditor5-elements-schema`](packages/ckeditor5-elements-schema)                   | Declare elements from a JSON file, with validation, and their commands     | `ckeditor5-elements-core`      |
| [`ckeditor5-elements-toolbar`](packages/ckeditor5-elements-toolbar)                 | Floating toolbars for elements, by name or filter                          | `ckeditor5-elements-core`      |
| [`ckeditor5-elements-interaction`](packages/ckeditor5-elements-interaction)         | Select elements as a whole, react to clicks on them; no widgets            | `ckeditor5-elements-core`      |
| [`ckeditor5-elements-menu`](packages/ckeditor5-elements-menu)                       | Element menu; context menu, breadcrumbs and Alt+Enter quick insert         | `ckeditor5-elements-core`      |
| [`ckeditor5-elements-example`](packages/ckeditor5-elements-example)                 | The full example: an editor with all the features (private, not published) | `ckeditor5-elements`           |
| [`ckeditor5-elements-docbook-example`](packages/ckeditor5-elements-docbook-example) | The DocBook example: Simplified DocBook XML data (private, not published)  | `ckeditor5-elements`           |
| [`ckeditor5-elements-dita-example`](packages/ckeditor5-elements-dita-example)       | The DITA example: Lightweight DITA XML data (private, not published)       | `ckeditor5-elements`           |
| [`ckeditor5-elements-xml-example`](packages/ckeditor5-elements-xml-example)         | The XML of the DocBook and DITA examples (private, not published)          | `ckeditor5-elements`           |
| [`docs`](docs)                                                                      | Documentation: guides with live examples, and the API reference            |                                |

The feature packages depend on each other in exact versions. Core fails to load twice, as CKEditor does
(`ckeditor-duplicated-modules`): two copies of it would mean two versions installed.

## Development

```sh
pnpm install
pnpm dev             # the documentation, with live examples (VitePress + TypeDoc)
pnpm example         # the full example, as a page of its own (Vite)
pnpm example:docbook # the DocBook example, as a page of its own (Vite)
pnpm example:dita    # the DITA example, as a page of its own (Vite)
pnpm docs:build      # the static documentation site, in docs/.vitepress/dist
pnpm test            # tests, in headless Chrome
pnpm test:coverage   # tests with a coverage report in coverage/, and its thresholds, for each package
pnpm check           # type check, lint, package consistency, format check, tests with coverage, docs build
pnpm smoke           # installs the packed packages into a new app, builds it and runs it in Chrome
pnpm version:set 49.0.0-alpha.4   # the version of all packages, which have the same one
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
`49.0.0-alpha.4`). A version can be published only once: set a new one first. Release them together, from `main` with
everything committed, logged in to npm (`npm login`):

```sh
pnpm version:set 49.0.0-alpha.5                                    # a version that is not published yet
pnpm check && pnpm smoke                                           # everything, and the packed packages in an app
pnpm -r publish --dry-run --access public --tag alpha --no-git-checks  # what would be published
pnpm publish:all                                                   # cleans, builds and publishes
```

`publish:all` removes the builds first (`pnpm clean`), so no file of a moved or removed source is published. pnpm
replaces the `workspace:*` dependencies with the exact version. The packages are published with the `alpha`
dist-tag; change `--tag` in the `publish:all` script for other releases.

The documentation is published on [GitHub Pages](https://ivankild.github.io/ckeditor5-elements/) by the
[Docs workflow](.github/workflows/docs.yml) on every push to `main` (or when run by hand).
