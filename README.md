# nb-editor

[![codecov](https://codecov.io/gh/notebox/nb-editor/graph/badge.svg?token=65QQDKPEPV)](https://codecov.io/gh/notebox/nb-editor)
[![sponsor](https://img.shields.io/static/v1?label=Sponsor&message=%E2%9D%A4&logo=GitHub&color=%23fe8e86)](https://github.com/sponsors/notebox)

A block based editor which is powered by [nb-crdt](https://github.com/notebox/nb-crdt) that enables collaborative editing across multiple participants allowing for flexible data sharing across spreadsheets, boards, rich text, and more.

Web-based multi-platform support (primarily focusing on macOS and iOS). Support for Composition input, such as Korean and Japanese, suggestion input, and iPad Pencil scribble.

## Development

### Prerequisites
```
npm install
```

### Run
```bash
npm start
```

## Usage
### for iframe
```
...
// set "./static/app.css" to "node_modules/@notebox/nb-editor/iframe/app.css"
<iframe ref={ref} src="node_modules/@notebox/nb-editor/iframe/index.html" />
...
```

### for component (react)
```
import {NBEditor, NBEditorWithToolbar} from "@notebox/nb-editor/main.component.tsx"
...
<NBEditor ctx={uiHandler} theme="black-theme" />
<NBEditorWithToolbar ctx={uiHandler} theme="black-theme" />
...
```

## Checkout Points
as a component
  - `main.component.tsx`
  - `iframe/app.css`

as a iframe resource
  - `iframe/index.html`
  - `iframe/static/app.js`
  - `iframe/static/app.css`

## Demo Screenshots
<img src="https://github.com/notebox/nb-editor/assets/8125241/e4c8ccca-ad68-42d6-b8d6-e87e320fc77d" height=480>
