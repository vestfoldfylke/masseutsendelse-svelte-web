<script lang="ts">
  import type { Dispatch, DispatchStatus } from "$lib/dispatch/types";
  import type { Template } from "$lib/templates/types";
  import type { UploadedFileData } from "$lib/uploader/types";
  import DispatchStatusSelect from "../DispatchStatusSelect.svelte";
  import SchemaFields from "../SchemaFields.svelte";
  import UploadField from "../uploader/UploadField.svelte";

  type Props = {
    dispatch: Dispatch;
    mode: "new" | "edit";
    isReadOnly: boolean;
    isLocked: boolean;
    isReadyToSave: boolean;
    isDispatchApproved: boolean;
    templates: Template[];
    selectedTemplateSchema?: object;
    onDispatchStatusChange: (status: DispatchStatus) => void;
    onTemplateChange: (template: Template | undefined) => void;
    onRemoveTemplate: () => void;
    onAttachmentsChanged: (attachments: UploadedFileData[]) => void;
    onDownloadAttachment: (file: UploadedFileData) => void;
    onDispatchApprovedChange: (approved: boolean) => void;
    onPreview: () => void;
    onSave: () => void;
    onReset: () => void;
    onClose: () => void;
  };

  let {
    dispatch = $bindable(),
    mode,
    isReadOnly,
    isLocked,
    isReadyToSave,
    isDispatchApproved,
    templates,
    selectedTemplateSchema,
    onDispatchStatusChange,
    onTemplateChange,
    onRemoveTemplate,
    onAttachmentsChanged,
    onDownloadAttachment,
    onDispatchApprovedChange,
    onPreview,
    onSave,
    onReset,
    onClose
  }: Props = $props();

  const openArchiveUrl = (): void => {
    if (dispatch.archiveUrl) {
      window.open(dispatch.archiveUrl, "_blank");
    }
  };

  const onTemplateSelectChange = (event: Event & { currentTarget: HTMLSelectElement }): void => {
    const templateId = event.currentTarget.value;
    onTemplateChange(templates.find((candidate) => candidate._id === templateId));
  };
</script>

<div class="card shadow form-panel">
  <h1 class="ds-heading" data-size="lg">Masseutsendelse</h1>
  <div class="form-inner">
    {#if mode === "edit"}
      <DispatchStatusSelect value={dispatch.status ?? "notapproved"} disabled={isLocked} onChange={onDispatchStatusChange} />
    {/if}

    {#if dispatch.archiveUrl}
      <button type="button" class="ds-button" data-variant="secondary" onclick={openArchiveUrl}>Åpne arkiv</button>
    {/if}

    <div class="ds-field">
      <label class="ds-label" for="dispatch-title"><span class="required">* </span>Prosjektnavn</label>
      <input id="dispatch-title" class="ds-input" bind:value={dispatch.title} disabled={isReadOnly} placeholder="Angi et prosjektnavn" />
    </div>
    <div class="ds-field">
      <label class="ds-label" for="dispatch-projectnumber"><span class="required">* </span>Prosjektnummer</label>
      <input id="dispatch-projectnumber" class="ds-input" bind:value={dispatch.projectnumber} disabled={isReadOnly} placeholder="Angi et nummer" />
    </div>
    <div class="ds-field">
      <label class="ds-label" for="dispatch-archivenumber"><span class="required">* </span>P360 saksnummer</label>
      <input
        id="dispatch-archivenumber"
        class="ds-input"
        bind:value={dispatch.archivenumber}
        disabled={isReadOnly}
        placeholder="Angi et nummer"
      />
      <div class="ds-paragraph" data-size="xs">Angi et saksnummer som allerede eksisterer i P360</div>
    </div>

    <div class="template-row">
      <div class="ds-field">
        <label class="ds-label" for="template-select">Velg mal</label>
        <select id="template-select" class="ds-input" value={dispatch.template._id ?? ""} disabled={isReadOnly} onchange={onTemplateSelectChange}>
          <option value="">Velg mal</option>
          {#each templates as template (template._id)}
            <option value={template._id}>{template.name}</option>
          {/each}
        </select>
      </div>
      {#if dispatch.template._id}
        <button type="button" class="ds-button" data-size="sm" disabled={isReadOnly} onclick={onRemoveTemplate}>Fjern mal</button>
      {/if}
    </div>

    {#if selectedTemplateSchema && "properties" in selectedTemplateSchema && Object.keys((selectedTemplateSchema as { properties: object }).properties).length > 0}
      <div class="schema-fields-wrapper">
        <h2 class="ds-heading" data-size="md">Flettefelter</h2>
        <SchemaFields bind:value={dispatch.template.data} schema={selectedTemplateSchema} disabled={isReadOnly} />
      </div>
    {/if}

    <h3 class="ds-heading" data-size="sm">Vedlegg</h3>
    <p class="ds-paragraph" data-size="xs">NB! Filene kan ikke være større enn 16mb tilsammen.</p>
    <UploadField
      bind:files={dispatch.attachments}
      disabled={isReadOnly}
      allowedExtensions={["pdf", "xlsx", "xls", "rtf", "msg", "ppt", "pptx", "docx", "doc", "png", "jpg", "jpeg"]}
      onUploaded={onAttachmentsChanged}
      onRemoveFiles={onAttachmentsChanged}
      onDownloadBlob={onDownloadAttachment}
    />

    <div class="centered-column">
      <button
        type="button"
        class="ds-button"
        disabled={!dispatch.template?._id && dispatch.template?.template === undefined}
        onclick={onPreview}
      >
        Se forhåndsvisning
      </button>
    </div>

    {#if mode === "new"}
      <div class="centered-column">
        <div class="ds-field">
          <input
            type="checkbox"
            class="ds-input"
            id="dispatch-approved"
            checked={isDispatchApproved}
            onchange={(event) => onDispatchApprovedChange(event.currentTarget.checked)}
          />
          <label class="ds-label" for="dispatch-approved">Følgende informasjon skal sendes ut til {dispatch.owners.length} {dispatch.owners.length === 1 ? "mottaker" : "mottakere"}</label>
        </div>
      </div>
    {/if}

    <div class="actions">
      <button type="button" class="ds-button" data-variant="secondary" data-size="sm" disabled={!isReadyToSave} onclick={onSave}>
        {mode === "new" ? "Send til godkjenning" : "Lagre"}
      </button>
      {#if mode === "new"}
        <button type="button" class="ds-button" data-variant="secondary" data-size="sm" onclick={onReset}>Start på nytt</button>
      {:else}
        <button type="button" class="ds-button" data-variant="secondary" data-size="sm" onclick={onClose}>Lukk</button>
      {/if}
    </div>
  </div>
</div>

<style>
  .card {
    width: 100%;
    max-width: 1200px;
    border-radius: 20px;
    background-color: var(--ds-color-neutral-background-default, white);
    min-height: 250px;
    padding: 1rem;
  }

  .shadow {
    box-shadow: 0 1px 5px 1px #888888;
  }

  .form-panel {
    width: 60%;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .form-inner {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .required {
    color: red;
  }

  .template-row {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
  }

  .schema-fields-wrapper {
    width: 100%;
    max-width: 750px;
  }

  .centered-column {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .actions {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
  }
</style>
