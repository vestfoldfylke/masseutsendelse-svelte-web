<script lang="ts">
  import Sjablong from "@vtfk/sjablong";
  import { decodeBase64 } from "$lib/base64";
  import { createEmptyDispatch, type Dispatch, type DispatchStatus, type Owner } from "$lib/dispatch/types";
  import { AppError } from "$lib/errors/AppError";
  import { deepMerge, pickKeys } from "$lib/objectUtils";
  import { type ParsedPolygon, parsePolygonFile } from "$lib/polyparser/polyparser";
  import type { EnrichedMatrikkelData } from "$lib/server/matrikkelEnrichment";
  import { uiState } from "$lib/state/uiState.svelte";
  import type { Template } from "$lib/templates/types";
  import type { MatrikkelEnhet } from "$lib/types/matrikkel.types";
  import type { UploadedFileData } from "$lib/uploader/types";
  import DispatchFormPanel from "./dispatch/DispatchFormPanel.svelte";
  import DispatchMatrikkelPanel from "./dispatch/DispatchMatrikkelPanel.svelte";
  import DispatchUploadStep from "./dispatch/DispatchUploadStep.svelte";
  import ErrorField from "./errors/ErrorField.svelte";
  import Loading from "./Loading.svelte";

  type ErrorLike = Error & {
    statusCode?: number;
    status?: number;
    errors?: string[];
    response?: { data?: { title?: string; message?: string; errors?: string | string[]; stack?: string } };
  };

  type PdfPreviewRequest = {
    attachments?: UploadedFileData[];
    createdByDepartment?: string;
    archivenumber?: string;
    createdBy?: string;
    template: Template;
  };

  type Props = {
    dispatch?: Dispatch;
    templates: Template[];
    onFetchMatrikkelData: (polygons: MatrikkelEnhet[]) => Promise<EnrichedMatrikkelData>;
    onSave: (dispatch: Dispatch) => Promise<void>;
    onPreview: (req: PdfPreviewRequest) => Promise<string>;
    onDownloadAttachment: (file: UploadedFileData) => void;
    onSaved?: () => void;
    onClose?: () => void;
  };

  let { dispatch = $bindable(createEmptyDispatch()), templates, onFetchMatrikkelData, onSave, onPreview, onDownloadAttachment, onSaved, onClose }: Props = $props();

  const initialDispatchStatus: DispatchStatus | undefined = dispatch.status;

  let error: ErrorLike | undefined = $state(undefined);
  let isParsingFile: boolean = $state(false);
  let isContactingMatrikkel: boolean = $state(false);
  let isMatrikkelApproved: boolean = $state(false);
  let isDispatchApproved: boolean = $state(false);
  let selectedTemplateSchema: object | undefined = $state(undefined);

  const isRequiredTemplateDataFilledIn: boolean = $derived.by(() => {
    const schemaProperties = (selectedTemplateSchema as { properties?: Record<string, unknown> } | undefined)?.properties;
    if (!selectedTemplateSchema || (schemaProperties && Object.keys(schemaProperties).length === 0)) {
      return true;
    }

    try {
      Sjablong.validateData($state.snapshot(selectedTemplateSchema), $state.snapshot(dispatch.template.data) ?? {}, { requireAll: true });
      return true;
    } catch {
      return false;
    }
  });

  const mode = $derived<"new" | "edit">(dispatch._id === undefined ? "new" : "edit");
  const isLocked: boolean = $derived(dispatch.status === "inprogress" || dispatch.status === "completed");
  const isReadOnly: boolean = $derived.by(() => {
    if (isLocked) {
      return true;
    }

    if (initialDispatchStatus === "notapproved") {
      return false;
    }

    return dispatch.status === "approved";
  });

  const isReadyToSave: boolean = $derived.by(() => {
    if (isReadOnly) {
      return false;
    }

    if (!isRequiredTemplateDataFilledIn || !dispatch.title || !dispatch.projectnumber || !dispatch.archivenumber) {
      return false;
    }

    if (!dispatch.template?._id && dispatch.attachments.length === 0) {
      return false;
    }

    return !(mode === "new" && (!isDispatchApproved || !isMatrikkelApproved));
  });

  const updateAttachmentTags = (): void => {
    if (dispatch.attachments.length <= 0) {
      return;
    }

    const firstAttachment: UploadedFileData = dispatch.attachments[0];
    if (firstAttachment) {
      firstAttachment.tags = dispatch.template?._id ? [] : ["Hoveddokument"];
    }

    dispatch.attachments = [...dispatch.attachments];
  };

  const onAttachmentsChanged = (): void => {
    updateAttachmentTags();
  };

  const onTemplateChanged = (template: Template | undefined): void => {
    if (!template?.template) {
      return;
    }

    const decodedMarkdown: string = decodeBase64(template.template);
    selectedTemplateSchema = Sjablong.generateSchema(decodedMarkdown, { requireAll: true } as { requireAll: boolean; propagateRequired: boolean });
    let templateData = Sjablong.createObjectFromSchema(selectedTemplateSchema, false) as Record<string, unknown>;

    if (dispatch.template?.data) {
      const matchingKeys = pickKeys(dispatch.template.data, [...Object.keys(templateData), "info"]);
      templateData = deepMerge(templateData, matchingKeys);
    }

    dispatch.template = { ...template, data: templateData };
    updateAttachmentTags();
  };

  const onRemoveTemplate = (): void => {
    if (!confirm("Er du helt sikker på at du vil fjerne malen?")) {
      return;
    }

    selectedTemplateSchema = undefined;
    dispatch.template = {};
    updateAttachmentTags();
  };

  const reset = (force = false): void => {
    if (!force && !confirm("Er du helt sikker på at du vil starte på nytt?")) {
      return;
    }

    dispatch = createEmptyDispatch();
    isParsingFile = false;
    isContactingMatrikkel = false;
    isMatrikkelApproved = false;
    isDispatchApproved = false;
    selectedTemplateSchema = undefined;
    error = undefined;
  };

  const parseFiles = async (files: UploadedFileData[]): Promise<void> => {
    try {
      if (!files || files.length === 0) {
        return;
      }

      isParsingFile = true;
      const firstFile = files[0];
      if (!firstFile) {
        return;
      }

      dispatch.polygons = parsePolygonFile(firstFile);
    } catch (err) {
      error = err as ErrorLike;
    } finally {
      isParsingFile = false;
    }
  };

  const fetchMatrikkelData = async (): Promise<void> => {
    try {
      isContactingMatrikkel = true;
      const polygons: MatrikkelEnhet[] = (dispatch.polygons?.polygons ?? []).map((polygon: ParsedPolygon) => ({ epsg: polygon.EPSG, vertices: polygon.vertices }));
      const result: EnrichedMatrikkelData = await onFetchMatrikkelData(polygons);

      dispatch.owners = [...dispatch.owners, ...result.owners];
      dispatch.excludedOwners = [...dispatch.excludedOwners, ...result.excludedOwners];
      dispatch.matrikkelUnitsWithoutOwners = [...dispatch.matrikkelUnitsWithoutOwners, ...result.matrikkelUnitsWithoutOwners];
      dispatch.stats = result.stats;
    } catch (err) {
      error = err as ErrorLike;
    } finally {
      isContactingMatrikkel = false;
    }
  };

  const excludeOwner = (owner: Owner): void => {
    dispatch.excludedOwners = [...dispatch.excludedOwners, owner];
    dispatch.owners = dispatch.owners.filter((candidate) => candidate.id !== owner.id);
    isDispatchApproved = false;
  };

  const includeOwner = (owner: Owner): void => {
    dispatch.owners = [...dispatch.owners, owner];
    dispatch.excludedOwners = dispatch.excludedOwners.filter((candidate) => candidate.id !== owner.id);
    isDispatchApproved = false;
  };

  const onExclusionReasonChange = (owner: Owner, value: string): void => {
    owner.exclusionReason = value;
  };

  const previewPDF = async (): Promise<void> => {
    if (!dispatch.template?._id) {
      alert("Forhåndsvisning kan ikke gjøres når mal ikke er valgt");
      return;
    }

    const data = deepMerge(dispatch.template.data ?? {}, dispatch.template.documentData);
    if (data && Object.keys(data).length > 0 && selectedTemplateSchema) {
      try {
        Sjablong.validateData(selectedTemplateSchema, data, { requireAll: true });
      } catch (err) {
        error = err as ErrorLike;
        return;
      }
    }

    try {
      uiState.previewPdfBase64 = await onPreview({
        attachments: dispatch.attachments,
        createdByDepartment: dispatch.createdByDepartment,
        archivenumber: dispatch.archivenumber,
        createdBy: dispatch.createdBy,
        template: dispatch.template
      });
    } catch (err) {
      error = err as ErrorLike;
    }
  };

  const saveOrEditDispatch = async (): Promise<void> => {
    if (!isReadyToSave) {
      error = new AppError("Kan ikke lagre", "Det mangler en eller flere felter før du kan lagre");
      return;
    }

    if (dispatch.status === "approved") {
      if (
        !confirm(
          `Er du helt sikker på at du vil lagre?\n\nStatus vil nå settes til "Godkjent"\nDette betyr at du vil sende ut brev til totalt: ${dispatch.owners.length} eiere.\n\nDu vil ha muligheten til å trekke tilbake godkjennelsen frem til 00:00 i dag.\nEtter dette vil masseutsendelsen låses og sendes ut.\nUtsendelsen vil skje påfølgende dag mellom kl 12.00 og kl 13.00.`
        )
      ) {
        return;
      }
    } else if (!confirm("Er du helt sikker på at du vil sende inn?")) {
      return;
    }

    try {
      await onSave(dispatch);
      onSaved?.();
    } catch (err) {
      error = err as ErrorLike;
    }
  };

  const onDispatchStatusChange = (status: DispatchStatus): void => {
    dispatch.status = status;
  };

  // Matches an already-set template (editing an existing dispatch) against the now-available
  // templates list once, on mount - mirrors the original's loadTemplates() "attempt to match" step.
  if (dispatch.template?.template) {
    const matchingTemplate = templates.find((candidate: Template) => candidate._id === dispatch.template._id);
    onTemplateChanged(matchingTemplate ?? dispatch.template);
  }

  updateAttachmentTags();
</script>

{#if error}
  <ErrorField {error} showResetButton onReset={() => reset(true)} />
{:else if mode === "new" && (!dispatch.polygons || dispatch.polygons.polygons.length === 0)}
  <DispatchUploadStep onUploaded={parseFiles} />
{:else if isParsingFile}
  <div class="centered-column">
    <Loading title="Filen behandles" message="Dette kan ta noen sekunder" />
  </div>
{:else}
  <div class="dispatch-editor">
    <DispatchMatrikkelPanel
      {dispatch}
      {mode}
      {isReadOnly}
      {isMatrikkelApproved}
      {isContactingMatrikkel}
      onFetchMatrikkelData={fetchMatrikkelData}
      onReset={() => reset()}
      onExcludeOwner={excludeOwner}
      onIncludeOwner={includeOwner}
      {onExclusionReasonChange}
      onMatrikkelApprovedChange={(approved) => (isMatrikkelApproved = approved)}
    />

    {#if isMatrikkelApproved || mode === "edit"}
      <DispatchFormPanel
        bind:dispatch
        {mode}
        {isReadOnly}
        {isLocked}
        {isReadyToSave}
        {isDispatchApproved}
        {templates}
        {selectedTemplateSchema}
        {onDispatchStatusChange}
        onTemplateChange={onTemplateChanged}
        {onRemoveTemplate}
        onAttachmentsChanged={() => onAttachmentsChanged()}
        {onDownloadAttachment}
        onDispatchApprovedChange={(approved) => (isDispatchApproved = approved)}
        onPreview={previewPDF}
        onSave={saveOrEditDispatch}
        onReset={() => reset()}
        onClose={() => onClose?.()}
      />
    {/if}
  </div>
{/if}

<style>
  .dispatch-editor {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .centered-column {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }
</style>
