<script lang="ts">
  import "@toast-ui/editor/dist/toastui-editor.css";
  import type { EditorOptions, MdNode, Editor as ToastEditor } from "@toast-ui/editor";
  import Sjablong from "@vtfk/sjablong";
  import { onMount } from "svelte";
  import { decodeBase64, encodeBase64 } from "$lib/base64";
  import { uiState } from "$lib/state/uiState.svelte";
  import type { Template as TemplateData } from "$lib/templates/types";
  import ErrorField from "./errors/ErrorField.svelte";
  import SchemaFields from "./SchemaFields.svelte";
  import InsertTemplateForm from "./templating/InsertTemplateForm.svelte";

  type ErrorLike = Error & {
    statusCode?: number;
    status?: number;
    errors?: string[];
    response?: {
      data?: {
        title?: string;
        message?: string;
        errors?: string | string[];
        stack?: string;
      };
    };
  };

  type Props = {
    template?: TemplateData;
    options?: Partial<EditorOptions>;
    hideModeSwitch?: boolean;
    showCloseButton?: boolean;
    height?: string;
    showDocumentTemplateSelect?: boolean;
    onSave?: (template: TemplateData) => Promise<void>;
    onPreview?: (req: { template: TemplateData; preview: true }) => Promise<string>;
    onSaved?: () => void;
    onClose?: () => void;
  };

  let { template, options, hideModeSwitch = false, showCloseButton = true, height = "500px", showDocumentTemplateSelect = false, onSave, onPreview, onSaved, onClose }: Props = $props();

  const DOCUMENT_TEMPLATES: Array<{ label: string; value: string; schema?: object }> = [
    {
      label: "Brevmal",
      value: "brevmal",
      schema: {
        type: "object",
        properties: {
          info: {
            type: "object",
            properties: {
              "our-reference": { label: "Vår referanse", type: "string" },
              "your-reference": { label: "Deres referanse", type: "string" },
              paragraph: { label: "Paragraf", type: "string" }
            }
          }
        }
      }
    }
  ];

  let error: ErrorLike | undefined = $state(undefined);
  let isShowInsertPlaceholderModal = $state(false);
  let hasChanged = $state(false);
  let editorContainer: HTMLDivElement | undefined = $state();
  let editor: ToastEditor | undefined;

  // Intentionally a one-time snapshot of the `template` prop (matches the original's Vue `created()`
  // hook) - the user edits this local copy until they explicitly save, later prop changes shouldn't
  // clobber in-progress edits.
  const initialTemplate: TemplateData = template && typeof template === "object" && Object.keys(template).length > 0 ? JSON.parse(JSON.stringify(template)) : {};
  if (initialTemplate.template && typeof initialTemplate.template === "string") {
    try {
      initialTemplate.template = decodeBase64(initialTemplate.template);
    } catch (err) {
      error = err as ErrorLike;
    }
  }
  initialTemplate.documentDefinitionId = initialTemplate.documentDefinitionId || "brevmal";

  let activeTemplate: TemplateData = $state(initialTemplate);

  const mode = $derived(activeTemplate._id ? "edit" : "new");

  const getDocumentTemplateSchema = (): object | undefined => {
    const found = DOCUMENT_TEMPLATES.find((candidate) => candidate.value === activeTemplate.documentDefinitionId);
    return found?.schema;
  };

  const mainTemplateSchema = $derived(getDocumentTemplateSchema());

  const customHTMLRenderer: EditorOptions["customHTMLRenderer"] = {
    text(node: MdNode) {
      if (!node.literal) {
        return [{ type: "text", content: "" }];
      }

      const parts: string[] = node.literal.split(Sjablong.regexPatterns.sjablong.brackets);

      return parts.flatMap((part: string) => {
        const isPlaceholder = part.match(Sjablong.regexPatterns.sjablong.brackets);
        if (isPlaceholder) {
          try {
            const parsed = Sjablong.parsePlaceholder(part) as { label?: string };
            return [
              { type: "openTag" as const, tagName: "span", classNames: ["placeholder-chip"] },
              { type: "text" as const, content: `[${parsed.label}]` },
              { type: "closeTag" as const, tagName: "span" }
            ];
          } catch {
            return [
              { type: "openTag" as const, tagName: "span", classNames: ["incomplete-placeholder-chip"] },
              { type: "text" as const, content: "[Uferdig]" },
              { type: "closeTag" as const, tagName: "span" }
            ];
          }
        }

        return [
          { type: "openTag" as const, tagName: "span" },
          { type: "text" as const, content: part },
          { type: "closeTag" as const, tagName: "span" }
        ];
      });
    }
  };

  const onMarkdownChanged = (): void => {
    if (!editor) {
      return;
    }
    hasChanged = true;
    activeTemplate.template = encodeBase64(editor.getMarkdown());
  };

  const onDocumentTemplateChanged = (): void => {
    const schema = getDocumentTemplateSchema();
    if (!schema) {
      return;
    }

    const defaultData = Sjablong.createObjectFromSchema(schema) as Record<string, unknown>;
    if (defaultData) {
      activeTemplate.data = defaultData;
    }

    onMarkdownChanged();
  };

  const onPreviewTemplate = async (): Promise<void> => {
    if (!editor) {
      return;
    }

    try {
      const markdown = editor.getMarkdown();
      Sjablong.validateTemplate(markdown);

      const templateRequest: TemplateData = { ...activeTemplate, template: encodeBase64(markdown) };
      const base64 = await onPreview?.({ template: templateRequest, preview: true });
      if (base64) {
        uiState.previewPdfBase64 = base64;
      }
    } catch (err) {
      error = err as ErrorLike;
    }
  };

  const onSaveTemplate = async (): Promise<void> => {
    if (!confirm("Er du helt sikker på at du vil lagre malen?")) {
      return;
    }
    if (!editor) {
      return;
    }

    const markdown = editor.getMarkdown();
    if (markdown === "" && !confirm("Malen er uten innhold, vil du fortsatt lagre?")) {
      return;
    }

    try {
      Sjablong.validateTemplate(markdown);
    } catch (err) {
      error = err as ErrorLike;
      return;
    }

    const schema = Sjablong.generateSchema(markdown);
    if (schema) {
      activeTemplate.schema = schema;
    }

    const templateRequest: TemplateData = { ...activeTemplate, template: encodeBase64(markdown) };

    try {
      await onSave?.(templateRequest);
    } catch (err) {
      error = err as ErrorLike;
      return;
    }

    onSaved?.();
  };

  const insertPlaceholder = (placeholder: { label?: string; type: string; description?: string; required: boolean; lines?: number; path: string }): void => {
    if (!placeholder || !editor) {
      return;
    }
    editor.insertText(Sjablong.convertPlaceholderToString(placeholder));
  };

  const close = (): void => {
    if (hasChanged && !confirm("Noe er endret, er du sikker på at du vil lukke før du har lagret?")) {
      return;
    }
    onClose?.();
  };

  onMount(() => {
    let disposed = false;

    (async () => {
      const { Editor } = await import("@toast-ui/editor");
      if (disposed || !editorContainer) {
        return;
      }

      const activeOptions: Partial<EditorOptions> = options ?? {
        hideModeSwitch,
        language: "no-NB",
        usageStatistics: false,
        frontMatter: true,
        toolbarItems: [["heading", "bold", "italic", "strike"], ["hr"], ["ul", "ol", "indent", "outdent"]]
      };

      editor = new Editor({
        el: editorContainer,
        height,
        initialValue: activeTemplate.template ?? "",
        initialEditType: "markdown",
        customHTMLRenderer,
        ...activeOptions
      } as EditorOptions);

      editor.on("change", onMarkdownChanged);

      // addCommand's declared CommandFn is ProseMirror-shaped, but markdown/wysiwyg-mode commands
      // accept a plain zero-arg callback at runtime - matches the original's plain-JS call.
      const insertPlaceholderCommand = (() => {
        isShowInsertPlaceholderModal = true;
        // biome-ignore lint/suspicious/noExplicitAny: see comment above.
      }) as any;
      editor.addCommand("markdown", "insertPlaceholder", insertPlaceholderCommand);
      editor.addCommand("wysiwyg", "insertPlaceholder", insertPlaceholderCommand);

      editor.insertToolbarItem(
        { groupIndex: -1, itemIndex: -1 },
        {
          name: "insertPlaceholder",
          tooltip: "Lag utfyllingsfelter",
          command: "insertPlaceholder",
          text: "📝",
          className: "toastui-editor-toolbar-icons first",
          style: { backgroundImage: "none" }
        }
      );
      // The original's second toolbar button just triggers "bold" here too - looks unfinished/vestigial
      // in the source (tooltip promises "Matrikkel flettefelter" but the command is a no-op copy-paste
      // of the button above it). Preserved as-is rather than guessing what it should actually do.
      editor.insertToolbarItem(
        { groupIndex: -1, itemIndex: -1 },
        {
          name: "matrikkelPlaceholder",
          tooltip: "Matrikkel flettefelter",
          command: "bold",
          text: "🗺️",
          className: "toastui-editor-toolbar-icons first",
          style: { backgroundImage: "none" }
        }
      );
    })();

    return () => {
      disposed = true;
      editor?.destroy();
    };
  });
</script>

{#if error}
  <ErrorField {error} showResetButton={false} onOk={() => (error = undefined)} showOkButton />
{:else}
  <div class="template-editor">
    <h2 class="ds-heading" data-size="md">Generelt</h2>
    <p class="ds-paragraph">Generell informasjon om malen</p>
    <div class="ds-field">
      <label class="ds-label" for="template-name">Navn</label>
      <input id="template-name" class="ds-input" bind:value={activeTemplate.name} />
    </div>
    <div class="ds-field">
      <label class="ds-label" for="template-description">Beskrivelse</label>
      <input id="template-description" class="ds-input" bind:value={activeTemplate.description} />
    </div>

    {#if showDocumentTemplateSelect}
      <h2 class="ds-heading" data-size="md">Dokumentmal</h2>
      <p class="ds-paragraph">Dette er dokumentmalen som omberammer denne innholdsmalen</p>
      <p class="ds-paragraph">Her kan du definere verdiene i flettefeltene til hovedmalen</p>
      <div class="ds-field">
        <label class="ds-label" for="document-template-select">Hovedmal</label>
        <select id="document-template-select" class="ds-input" bind:value={activeTemplate.documentDefinitionId} onchange={onDocumentTemplateChanged}>
          {#each DOCUMENT_TEMPLATES as documentTemplate (documentTemplate.value)}
            <option value={documentTemplate.value}>{documentTemplate.label}</option>
          {/each}
        </select>
        <div class="ds-paragraph" data-size="xs">Dette er hovedmalen som omfavner innholdet i denne innholdsmalen</div>
      </div>
      {#if mainTemplateSchema}
        <SchemaFields bind:value={activeTemplate.documentData} schema={mainTemplateSchema} onError={(e) => (error = e)} />
      {/if}
    {/if}

    <h2 class="ds-heading" data-size="md">Innholdsmal</h2>
    <p class="ds-paragraph">Mal for innholdet i masseutsendelsene som skal sendes ut</p>
    <div bind:this={editorContainer}></div>

    <div class="actions">
      <button type="button" class="ds-button" data-size="sm" onclick={onSaveTemplate}>Lagre</button>
      <button type="button" class="ds-button" data-size="sm" onclick={onPreviewTemplate}>Forhåndsvisning</button>
      {#if showCloseButton}
        <button type="button" class="ds-button" data-size="sm" data-variant="secondary" onclick={close}>Lukk</button>
      {/if}
    </div>

    <dialog
      class="ds-dialog"
      data-placement="center"
      open={isShowInsertPlaceholderModal}
      onclose={() => (isShowInsertPlaceholderModal = false)}
    >
      {#if isShowInsertPlaceholderModal}
        <InsertTemplateForm onInsert={insertPlaceholder} onClose={() => (isShowInsertPlaceholderModal = false)} />
      {/if}
    </dialog>
  </div>
{/if}

<style>
  .template-editor {
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  :global(.placeholder-chip) {
    cursor: pointer;
    border: 1px solid #5a9491;
    background-color: #b4dcda;
    border-radius: 8px;
    font-weight: bold;
    margin-left: 0.05rem;
    margin-right: 0.05rem;
    padding: 0.08rem 0.5rem;
  }

  :global(.incomplete-placeholder-chip) {
    cursor: pointer;
    border: 1px solid #f3b5b2;
    background-color: #e7827e;
    font-weight: bold;
    border-radius: 8px;
    margin-left: 0.05rem;
    margin-right: 0.05rem;
    padding: 0.08rem 0.5rem;
  }
</style>
