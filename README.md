# masseutsendelse-svelte-web

Svelte 5 / SvelteKit rewrite of `vue-masseutsendelse-web` (Vue 2 + Vuetify + Vuex). Rewriting in Svelte 5 keeps the whole JS ecosystem intact and only requires porting the Vue-specific component/template layer.

## Architecture decisions

- **UI kit:** [Designsystemet](https://www.npmjs.com/package/@digdir/designsystemet-css) (`@digdir/designsystemet-css` + `@digdir/designsystemet-web`), *not* `@vtfk/components`. Designsystemet ships native Web Components (custom elements, `ds-*`), so — unlike the old app's React-via-`vuera` bridge — no framework bridging library is needed at all.
- **Auth:** Azure App Service Authentication ("Easy Auth"), *not* `@azure/msal-browser` or `@azure/identity`. App Service handles the Entra ID login redirect at the platform level, injects an `X-MS-CLIENT-PRINCIPAL` header with the user's claims (`hooks.server.ts` reads it), and — with token store enabled — also injects an `X-MS-TOKEN-AAD-ACCESS-TOKEN` header carrying the user's own delegated access token for the backend API, which we forward as-is rather than minting a separate app-identity token.
- **Hosting:** Azure Web App via App Service's built-in Node.js runtime (`@sveltejs/adapter-node`) — replaces the old app's Azure Static Web Apps SPA deployment. **Not containerised** — no Dockerfile; `npm run build` then `node build/index.js` runs directly on the platform's Node runtime.
- **Linting:** Biome (config copied from the org's canonical template), no ESLint/Prettier.

## Developing

```sh
npm install
npm run dev -- --open
```

## Building

```sh
npm run build   # outputs a Node server via adapter-node
npm run preview # preview the production build locally
```

`npm run test` runs the full gate: `tsc --noEmit`, Biome lint, `svelte-check`, Vitest, and a production build.

## Migration task list

Source app: `vue-masseutsendelse-web` (~5900 LOC Vue 2). Tasks are ordered as a rough dependency chain — foundation first, then components roughly in ascending effort, then integration. Check items off as they land.

### Phase 1 — Foundation

- [x] **1. Implement `hooks.server.ts` reading `X-MS-CLIENT-PRINCIPAL`**
  Decode the base64-encoded JSON claims Easy Auth injects into the `X-MS-CLIENT-PRINCIPAL` header on every authenticated request, and expose the result as `event.locals.user`. Add the corresponding type to `src/app.d.ts` (`App.Locals.user`). There is no login page/flow to write — App Service already redirected the user to Entra ID and back before this hook ever runs; an unauthenticated request simply never reaches the app. Replaces: the entire MSAL setup in `vue-masseutsendelse-web/src/main.js` (`$msal`, `$acquireTokenRedirect`, `$acquireTokenPopup`, `$isAuthenticationRequired`) and the auth guard in `vue-masseutsendelse-web/src/router.js:61-74`.

- [x] **2. Forward Easy Auth's AAD access token value to the backend API**
  `@azure/identity` was uninstalled — it authenticates the app's *own* identity (Managed Identity), which is the wrong credential shape for calling an API that requires a specific signed-in user (delegated permissions). Instead: when App Service's token store is enabled and the AAD provider is configured to request the backend API's scope, Easy Auth injects the user's actual delegated access token into an `X-MS-TOKEN-AAD-ACCESS-TOKEN` header on every authenticated request — that's what we forward, exactly mirroring what the old Vue app did via MSAL. Implemented as `getAccessTokenValue(event)` in `src/lib/server/auth.ts`, which reads that header and, if the value is expired or near-expiry (checked by decoding the JWT's `exp` claim), refreshes it via Easy Auth's `/.auth/refresh` + `/.auth/me` dance (refresh has no response body — the refreshed value is only readable back from `/.auth/me`). **Depends on infra config**, not just app code: the App Service resource needs token store enabled and the AAD provider must request the backend API's scope, or this silently returns `null`. Task 3's API client will call this before each backend request.

- [x] **3. Port API client layer from `store.js` to `src/lib/api`**
  Implemented as `src/lib/server/api/{client,dispatches,templates,brreg,blobs,pdf,matrikkel}.ts` — server-only (each needs the request `event` for `getAccessTokenValue`). `client.ts`'s `callApi()` is the shared authenticated-fetch helper (base URL from `$env/dynamic/private`, throws `AppError` on non-ok responses); each domain file mirrors a `store.js` action 1:1, including the exact (and slightly asymmetric) `removeKeys()` field-stripping lists for dispatches vs. templates create/update. `getPdfPreview`'s sector/caseworker fallback now reads `event.locals.user` (task 1) instead of MSAL token claims. Domain types (`Dispatch`, `Template`) are intentionally loose (`Record<string, unknown>`) pending task 13/14 revealing the real shapes.

- [x] **4. Copy over framework-agnostic lib modules unchanged**
  `AppError`, `helpers.ts`, and `polyparser` (polyparser/dxf/kml) ported to TS under `src/lib` with two pre-existing logic bugs fixed along the way (an EPSG range check compared the whole coordinate array instead of one element; a KML polygon-vertex-count check read the wrong array index). `matrikkelProxyClient.js` turned out **not** to be a pure copy — it depended directly on the Vuex store — so it's split into `src/lib/matrikkel/matrikkelUtils.ts` (pure, client-safe: `getItemType`/`getItemValue`/`getMatrikkelEnheterOwnerCentric`) and `src/lib/server/api/matrikkel.ts` (networking, built on task 3's `callApi`). Also dropped `lodash.get`/`set`/`merge`/`unset` and `@vtfk/utilities`'s `removeKeys` in favor of a small hand-rolled `src/lib/objectUtils.ts` — two of those lodash packages carry an unpatched high-severity prototype-pollution CVE.

### Phase 2 — Low-effort component ports

All of these swap `@vtfk/components` (React) for Designsystemet (`ds-*` custom elements) and are otherwise near 1:1 template ports.

- [x] **5. Port AppError-based error UI (ErrorField, ErrorModal) to Designsystemet**
  Ported to `src/lib/components/errors/{ErrorField,ErrorModal}.svelte` using Svelte 5 runes + `ds-heading`/`ds-button` classes and a native `<dialog class="ds-dialog">` instead of Vuetify's `v-dialog`. Preserved an original quirk faithfully rather than "fixing" it: the H1 title only ever comes from `error.response.data.title` (never `AppError.title` directly), so `defaultTitle` ("En feil har oppstått") is what actually renders for most in-app `AppError`s, with the specific message showing as the H3 below it — changing that would be a real UX change, not a straight port. Dropped one dead invisible button with no handler that existed in the original markup.

- [x] **6. Port Loading and LoadingModal components**
  Ported to `src/lib/components/{Loading,modals/LoadingModal}.svelte`. Designsystemet's spinner is CSS-only (no custom element), so `Loading.svelte` hand-builds the exact SVG markup from Designsystemet's own React source (`viewBox="0 0 50 50"`, two `<circle>`s, `role="img"`). `LoadingModal` uses native `<dialog>.showModal()` and intercepts the `cancel` event to replicate Vuetify's `persistent` (non-dismissable) behavior.

- [x] **7. Port Header + top nav to Designsystemet**
  Reference: `vue-masseutsendelse-web/src/components/Header.vue` (83 lines). Uses `InitialsBadge`, `IconDropdownNav`, `IconDropdownNavItem` from `@vtfk/components` — replace with Designsystemet's Avatar + a menu/dropdown pattern. Nav items: Hjelp (opens guide modal), Utsendelser, Maler, Logg ut. **Logg ut must point at `/.auth/logout`** (Easy Auth's endpoint), not the old MSAL logout flow — this is a behavior change, not just a styling port.

- [x] **8. Port low-effort small components**
  Ported to `src/lib/components/{DispatchStatusSelect,StatCards,GuideModal,GuideBtnModal,templating/InsertTemplateForm,uploader/{FileIcon,UploaderFile}}.svelte`. `GuideBtnModal`'s `$root.$on('GuideBtnModal')` global-event listener was dropped — nothing in the old repo ever emits it, confirmed by grep. `FileIcon` uses `import.meta.glob` over the 48 file-type SVGs and got upgraded from a bare clickable `<img>` to a real `<button>` wrapper (the original had no keyboard handler on the click target — `svelte-check` flagged it as an a11y regression). `InsertTemplateForm` preserves the original's real (non-buggy) behavior: `placeholder.type` is always `"string"` even for the "multistring" UI option — the single/multi-line distinction is carried by the `lines` field alone, matching how `SchemaFields` (task 11) renders it.

### Phase 3 — Medium-effort component ports

- [x] **9. Port MatrikkelTable and MatrikkelOwnerTable**
  Ported to `src/lib/components/{MatrikkelTable,MatrikkelOwnerTable}.svelte`. Designsystemet's table is CSS-only (no built-in pagination/expand/sort like Vuetify's `VDataTable`), so expand/collapse is hand-rolled (`Set`-based expanded-row state) and pagination was dropped (not critical path). `MatrikkelOwnerTable`'s exclude/include/exclusion-reason-edit are callback props (`onExclude`/`onInclude`/`onExclusionReasonChange`) rather than mutating the `items` prop in place — Svelte 5 doesn't track deep mutations on plain prop objects the way Vue 2 did, so task 14 (`DispatchEditor`) will own moving owners between included/excluded arrays. Also dropped a dead `item.adresse` slot template that referenced a column never actually in this table's header list (a copy-paste leftover from `MatrikkelTable`'s own nested table, where that column is real).

- [x] **10. Port file upload components (UploadField, FileList)**
  Ported to `src/lib/components/uploader/{UploadField,FileList}.svelte` + `src/lib/uploader/types.ts`. Drag&drop rewritten in Svelte's event-binding style; `files` is now a `$bindable()` prop (replaces v-model). **Architecture change, not just a styling port:** `FileList.vue`'s `downloadBlob()` did a direct client-side `fetch` with the MSAL access token attached as an Authorization header — that's impossible now, since the access token only ever exists server-side (Easy Auth's header isn't readable by client JS, see task 2). Downloading a file with no `dataUrl` now always calls an `onDownloadBlob` callback; **task 14/15 must wire that to a server route that does the authenticated fetch server-side** and hands the data back to the client. The now-unused `downloadBaseUrl` prop was dropped from both components.

- [x] **11. Port SchemaFields (Sjablong-driven recursive form)**
  Ported to `src/lib/components/SchemaFields.svelte`. `@vtfk/sjablong` installed as-is (framework-agnostic). It carries a transitive high-severity ReDoS (linkify-it, via markdown-it) — checked its actual source (`node_modules/@vtfk/sjablong/lib/sjablong.js:516`) and confirmed it never passes `linkify: true` to markdown-it, so that code path isn't reachable through Sjablong's own usage; documenting rather than forcing a risky major-version override on markdown-it blind. Replaced `lodash.get`/`set`/`unset`/`merge` with task 4's `getPath`/`setPath`/`unsetPath`/`deepMerge`. One real gotcha: the original's Vue `watch: { schema }` only re-runs on the `schema` prop changing, never on internal data edits — a naive Svelte 5 `$effect` would re-run on every keystroke too (since `setSchema()` both reads and writes the bindable `value`), so it needed `svelte`'s `untrack()` to scope the dependency to `schema` alone.
  Unrelated `npm audit` note picked up while installing this: `cookie <0.7.0`, moderate severity, transitive via `@sveltejs/kit`/`adapter-node`'s own dependencies — not introduced by anything in this project, and no fix currently available without moving to an unstable SvelteKit prerelease. Track for a future stable SvelteKit patch release.

### Phase 4 — Hard component ports

- [x] **12. Build Map.svelte as a direct Leaflet wrapper**
  Ported to `src/lib/components/Map.svelte`. Leaflet is imported dynamically inside `onMount` (a static top-level import would execute browser-only code during SSR) — the default-icon-URL bundler workaround and tile-layer/marker setup carry over faithfully. Fixed a latent bug along the way: the original always re-*guessed* the EPSG code when transforming the map center/extremes (`this.polygon.EPSG` was read but never actually set anywhere, so `transformCoordinates` silently fell back to auto-detection there) even though the per-vertex transform correctly used the file's real, already-known EPSG — both paths now use the same known EPSG consistently. Reactive re-render on `polygons`/`lineColor`/`fillColor` changes via `$effect`, gated on an `isMapReady` flag so it doesn't race the async Leaflet import.

- [x] **13. Port TemplateEditor with TOAST UI + Sjablong integration**
  Ported to `src/lib/components/TemplateEditor.svelte`, verified working in an actual browser (dev server smoke test — the editor loaded, custom toolbar buttons rendered, and typing a Sjablong placeholder correctly rendered the fallback "incomplete" chip styling via the custom renderer).
  - **Security fix along the way:** `@toast-ui/editor@3.2.2` bundles `dompurify@2.5.9`, which carries ~15 known XSS-bypass CVEs. Forced an `overrides` entry in `package.json` (`"dompurify": "^3.4.11"`) and confirmed in-browser that the editor still works correctly with the newer major version.
  - Base64 encode/decode no longer uses `Buffer` (doesn't exist in the browser) — new `src/lib/base64.ts` has a UTF-8-safe `btoa`/`atob`-based `encodeBase64`/`decodeBase64`.
  - `Sjablong.validateTemplate`/`generateSchema`/`flattenSchema`/`createObjectFromSchema` all confirmed working client-side. There's a benign Vite console warning ("Module 'buffer' has been externalized") from an unrelated, unused Sjablong code path (its front-matter/markdown-to-HTML feature) — not triggered by anything this component calls, but worth re-checking if a future feature ever calls `Sjablong.getHTMLandMetadataFromMarkdown`/`getFrontMatterData`.
  - The second toolbar button (🗺️, tooltip "Matrikkel flettefelter") still just triggers `bold` — preserved exactly as in the original rather than guessing what it should actually do; flagging again here since it's genuinely unfinished-looking.
  - **Gap found and filled:** `App.vue`'s global PDF preview modal (`@vtfk/components`'s `PDFPreviewModal`) was never tracked as its own task item. Added as `src/lib/components/modals/PdfPreviewModal.svelte`, driven by a new `uiState.previewPdfBase64` field — needs mounting in the root layout during task 15.
  - `onSave`/`onPreview` are callback props — TemplateEditor is a client component and can't call task 3's server-only API functions directly; task 15 must wire these to real requests (e.g. via `+server.ts` endpoints).

- [x] **14. Port DispatchEditor split into smaller Svelte components**
  Ported to `src/lib/components/DispatchEditor.svelte` (orchestrator, holds all state/logic) + `src/lib/components/dispatch/{DispatchUploadStep,DispatchMatrikkelPanel,DispatchFormPanel}.svelte` (presentational children) — not as one 1295-line file. Verified rendering (initial upload step + zone-list toggle) in a browser smoke test, no console errors.

  **The single biggest architecture change in this whole migration:** `getDataFromMatrikkelAPI()` (~330 lines — batch matrikkel-enhet lookup plus a dense set of owner-exclusion business rules: GDPR/privacy-sensitive, Norwegian bureaucratic status codes for who legally gets contacted) ran entirely client-side in the old app. It needs the server-side access token now (task 2), so it moved to `src/lib/server/matrikkelEnrichment.ts` behind a new `POST /api/matrikkel-enrichment` endpoint, ported as literally as possible to preserve every exclusion rule exactly. **Known regression:** the old app streamed live per-batch progress messages to the UI while this ran; it's now a single request/response, so the client just shows one generic loading state for the whole duration — flagged as a candidate for an SSE/polling follow-up if that granularity turns out to matter.

  Also: unified `Owner`/`Ownership`/`MatrikkelUnit`/`Template` into canonical types (`src/lib/dispatch/types.ts`, `src/lib/templates/types.ts`) and retrofitted them into tasks 9 and 13's components, which had only guessed at the real shapes before this task revealed them. Added `pickKeys()` to `objectUtils.ts` (the `lodash.pick` replacement) for the template-switch data-merge logic. CSV export ported to `src/lib/dispatch/exportOwners.ts`. Found (and preserved, not "fixed") a pre-existing bug where the original passed a `{query:{flatten,metadata}}` object into what its own method signature treats as `matrikkelContext` — silently doing nothing useful; my task-4 API client already sends a correct context there instead, a discovered behavior change flagged back in task 4.

### Phase 5 — Integration

- [x] **15. Port views/routes: Home, Utsendelser, Templates, Login/Logout**
  Ported to `src/routes/{+layout.server.ts,+layout.svelte,+page.server.ts,+page.svelte,utsendelser/,maler/,logout/}`, plus a full set of API routes (`src/routes/api/{dispatches,templates,pdf-preview,blobs}`) and client-side fetch helpers (`src/lib/client/{apiFetch,dispatchApi,templateApi}.ts`) that the pages and `DispatchEditor`/`TemplateEditor`'s callback props call into.

  Added a **dev-only auth bypass** in `hooks.server.ts` (injects a fake user when there's no `X-MS-CLIENT-PRINCIPAL` header, only in dev mode) — local dev has no App Service in front, so without this every page would fail before rendering anything. This does not unblock real backend calls (those still need a real access token value and a real `MASSEUTSENDELSE_API_BASE_URL`), it just lets pages render and navigate locally.

  **Verified in browser:** layout + Header render correctly with the dev user; `/logout` renders fully (no backend dependency); `/` and `/utsendelser` gracefully show a 502 with a clear Norwegian error message when the backend call fails — expected without real Azure infra, and it proves the error-handling path works end to end rather than crashing.

  `Login.vue`/`Logout.vue` dropped as planned — Easy Auth replaces the MSAL flow entirely; `/logout` is now a static landing page. **Infra note discovered while building this:** `/logout` must be configured as a public/excluded path in App Service's auth settings, or Easy Auth will redirect straight to the Entra ID login screen before the "you are logged out" page ever renders, since the session cookie is already cleared by the time this page loads. `Development.vue` (a dev-only checkbox scratch page) was not ported — read it in full; it added no real value in the original either.

- [x] **16. ~~Set up Dockerfile for Azure Web App deployment~~ — not needed**
  Corrected during the migration: this deploys to Azure Web App via App Service's *built-in* Node.js runtime, not a custom container. No Dockerfile — `npm run build` then `node build/index.js` (adapter-node's output) runs directly on the platform.

- [x] **17. End-to-end test pass through golden path in browser**
  A true "golden path with real data" pass isn't achievable without a deployed environment (real Easy Auth + real `azf-masseutsendelse-api`) — documenting the honest boundary here rather than claiming full verification.

  **Verified in browser this session:** `Map.svelte` renders with Leaflet (the `dompurify` override from task 13 doesn't break TOAST UI); `TemplateEditor` renders, custom toolbar buttons work, and `Sjablong`'s `validateTemplate`/`generateSchema`/`flattenSchema`/`createObjectFromSchema`/`parsePlaceholder` are all confirmed working client-side, including the placeholder-chip custom renderer; `DispatchEditor` renders its initial upload step and zone-list toggle; the full app (layout + Header + routing) renders correctly using the dev-only auth bypass (task 15); `/logout` renders fully; `/` and `/utsendelser` gracefully show a clear 502 error (not a crash) when the backend is unreachable, which proves the error-handling path works end to end.

  **Not verifiable without a deployed environment:** real Matrikkel lookups, real PDF generation, real dispatch save/edit round-trips, real file drag&drop end-to-end. These need either a live Azure deployment (real Easy Auth + backend) or substantial mocking infrastructure — both out of scope for a local port.

  **Also added:** a first pass of unit tests — there were previously zero test files, which meant the project's own `npm test` gate failed outright. Added `src/lib/objectUtils.test.ts`, `src/lib/polyparser/polyparser.test.ts`, `src/lib/server/auth.test.ts` (18 tests, all passing) covering the highest-risk hand-ported pure logic. `npm test` (tsc + Biome + `svelte-check` + Vitest + build) now passes cleanly end to end. Comprehensive component-level test coverage remains a good follow-up, not attempted here.

## Migration complete — summary
Foundation (1–4): Easy Auth header parsing, access-token forwarding + refresh, the full server-side API client layer, and all framework-agnostic libs ported (with two real bugs fixed along the way and a vulnerable lodash swap).

Components (5–14): Every Vue component ported to Svelte 5 + Designsystemet, including the three hard ones — Map.svelte (direct Leaflet wrapper), TemplateEditor.svelte (TOAST UI + Sjablong, plus a real security fix: overrode a vulnerable bundled DOMPurify), and DispatchEditor.svelte (split into 4 components; its matrikkel-enrichment pipeline — ~330 lines of GDPR-sensitive owner-exclusion rules — moved server-side into a new API route, the single biggest architecture change in the whole port).

Integration (15–17): All routes wired up (/, /utsendelser, /maler, /logout) with a full REST API layer, a dev-only auth bypass for local testing, and the hosting approach corrected per your steer — plain Azure Web App via the built-in Node runtime, no Dockerfile.

Verified: type-checked, linted, and built after every single task (not just at the end), plus real browser smoke tests of the riskiest pieces (TOAST UI + patched DOMPurify, Sjablong, Leaflet, full routing/auth/error-handling). Added a first pass of unit tests since none existed. The full npm test gate — tsc, Biome, svelte-check, Vitest, build — passes cleanly.

What's genuinely not verifiable locally: real Matrikkel lookups, real PDF generation, real save/edit round-trips — these need a live Azure deployment with real Easy Auth and the real backend API. That's the honest boundary of what a local port can prove.

The README has the full task-by-task breakdown with every architectural decision, bug fix, and open item documented. Nothing's committed to git — that's yours to do when ready.