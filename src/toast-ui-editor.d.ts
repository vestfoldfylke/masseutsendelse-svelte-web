/**
 * @toast-ui/editor's package.json declares a `types` field but its `exports` map has no `types`
 * condition on the "." entry, so bundler/node16 module resolution can't find its own type
 * declarations. Redirect via a relative filesystem path (bypasses "exports" resolution entirely,
 * unlike a bare package specifier) rather than adding tsconfig `paths` - a custom `paths` entry in
 * this project's root tsconfig.json would silently replace (not merge with) SvelteKit's
 * auto-generated `$lib` path mapping, since TS `extends` doesn't deep-merge the `paths` object.
 */
declare module "@toast-ui/editor" {
  export { CustomHTMLRenderer, Editor, EditorOptions } from "../node_modules/@toast-ui/editor/types/editor";
  export { MdNode } from "../node_modules/@toast-ui/editor/types/toastmark";
}
