# CKEditor 5 Elements

| Package                                                                       | Description                                                      | Depends on               |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------ |
| [`ckeditor5-elements`](packages/ckeditor5-elements)                           | Toggle (wrap/unwrap) commands and buttons, the `#` toolbar break | –                        |
| [`ckeditor5-elements-context-menu`](packages/ckeditor5-elements-context-menu) | Element context menu, clipboard actions, submenus                | –                        |
| [`ckeditor5-elements-quick-insert`](packages/ckeditor5-elements-quick-insert) | Alt+Enter quick insert, "Insert ›" in the context menu           | `…-context-menu`         |
| [`ckeditor5-elements-breadcrumbs`](packages/ckeditor5-elements-breadcrumbs)   | Element path at the selection                                    | – (uses the menu if any) |
| [`sandbox`](sandbox)                                                          | A `ClassicEditor` with all of them                               |                          |

## Development

```sh
pnpm install
pnpm dev             # the sandbox, with CKEditor Inspector
pnpm test            # tests, in headless Chrome
pnpm test:coverage   # tests with a coverage report in coverage/
pnpm check           # type check, lint, format check and tests
```

The tests run in Vitest browser mode, with Playwright driving the installed Google Chrome. To use a Playwright-managed
Chromium instead, run `pnpm exec playwright install chromium` and set `PLAYWRIGHT_CHANNEL=chromium`.

## Layout

```
packages/<package>/
├── src/          # sources
├── tests/        # tests, mirroring src/
└── theme/        # styles, published as `<package>/index.css`
testUtils/        # helpers shared by the tests
```

## Publishing

```sh
pnpm publish:all
```
