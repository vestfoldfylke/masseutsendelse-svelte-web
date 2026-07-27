<script lang="ts">
  import uploadIcon from "$lib/assets/icons/upload.svg";
  import uploadDisabledIcon from "$lib/assets/icons/upload-disabled.svg";
  import type { UploadedFileData } from "$lib/types/upload.types";
  import FileListDisplay from "./FileList.svelte";

  const MAX_SINGLE_FILE_SIZE = 16_000_000;

  type Props = {
    files?: UploadedFileData[];
    disabled?: boolean;
    showReset?: boolean;
    showList?: boolean;
    convertDataToDataUrl?: boolean;
    allowedExtensions?: string[];
    maxFilenameLength?: number;
    onUploaded?: (files: UploadedFileData[]) => void;
    onRemoveFiles?: (files: UploadedFileData[]) => void;
    onDownloadBlob?: (file: UploadedFileData) => void;
  };

  let {
    files = $bindable([]),
    disabled = false,
    showReset = false,
    showList = true,
    convertDataToDataUrl = true,
    allowedExtensions,
    maxFilenameLength = 255,
    onUploaded,
    onRemoveFiles,
    onDownloadBlob
  }: Props = $props();

  let error: string | undefined = $state(undefined);
  let isDraggedOver = $state(false);
  let fileInput: HTMLInputElement | undefined = $state();

  const icon = $derived(disabled ? uploadDisabledIcon : uploadIcon);

  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = (event) => reject(event);
      reader.readAsDataURL(file);
    });

  const readFileAsText = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = (event) => reject(event);
      reader.readAsText(file);
    });

  const addFiles = async (incoming: FileList | File[]): Promise<void> => {
    if (disabled) {
      return;
    }

    const incomingFiles = Array.from(incoming);
    const nextFiles: UploadedFileData[] = JSON.parse(JSON.stringify(files));

    let uploadedCount = 0;
    for (const file of incomingFiles) {
      const existingIndex = nextFiles.findIndex((existing) => existing.name === file.name);
      if (existingIndex > -1 && !confirm(`Filen ${file.name} finnes allerede, vil du overskrive den?`)) {
        continue;
      }

      if (file.name.length > maxFilenameLength) {
        alert(`Filnavnet kan ikke være lengre enn ${maxFilenameLength} tegn`);
        continue;
      }

      if (allowedExtensions) {
        const lowerCaseAllowedExtensions = allowedExtensions.map((extension) => extension.toLowerCase());
        const extension = file.name.includes(".") ? file.name.substring(file.name.lastIndexOf(".") + 1).toLowerCase() : "";
        if (!extension || !lowerCaseAllowedExtensions.includes(extension)) {
          alert(`${file.name} er ikke en tillatt filtype`);
          continue;
        }
      }

      const data = convertDataToDataUrl ? await readFileAsDataUrl(file) : await readFileAsText(file);

      const fileData: UploadedFileData = {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
        data
      };

      if (fileData.size > MAX_SINGLE_FILE_SIZE) {
        alert(`Navn: ${fileData.name}\nStørrelse: ${Math.round(fileData.size / 1_000_000)}mb\n\nFilen er for stor, filen kan ikke være større enn ${Math.round(MAX_SINGLE_FILE_SIZE / 1_000_000)}mb`);
        continue;
      }

      const totalFileSize = nextFiles.reduce((total, existing) => total + existing.size, 0);
      if (totalFileSize + fileData.size > MAX_SINGLE_FILE_SIZE) {
        alert(
          `Størrelsen på filene du har lastet opp er for stor.\n\nDu har lastet opp: ${Math.round(totalFileSize / 1_000_000)} mb av ${Math.round(MAX_SINGLE_FILE_SIZE / 1_000_000)} mb\n\nFilen du prøver å laste opp er ${Math.round(fileData.size / 1_000_000)} mb\n\nOm du ønsker å laste opp flere filer bør du komprimere filene du alt har lastet opp.`
        );
        continue;
      }

      if (existingIndex > -1) {
        nextFiles[existingIndex] = fileData;
      } else {
        nextFiles.push(fileData);
      }
      uploadedCount++;
    }

    isDraggedOver = false;
    if (uploadedCount === 0) {
      return;
    }

    files = nextFiles;
    onUploaded?.(nextFiles);
  };

  const reset = (): void => {
    files = [];
    error = undefined;
  };

  const onDropzoneClick = (event: MouseEvent): void => {
    if (disabled) {
      return;
    }
    if ((event.target as HTMLElement).closest("button")) {
      return;
    }
    fileInput?.click();
  };

  const onDrop = (event: DragEvent): void => {
    event.preventDefault();
    if (disabled || !event.dataTransfer?.files) {
      return;
    }
    void addFiles(event.dataTransfer.files);
  };

  const onFilesChanged = (event: Event & { currentTarget: HTMLInputElement }): void => {
    if (disabled || !event.currentTarget.files) {
      return;
    }
    void addFiles(event.currentTarget.files);
  };

  const removeFiles = (filesToRemove: UploadedFileData[]): void => {
    if (disabled) {
      return;
    }
    const namesToRemove = filesToRemove.map((file) => file.name);
    files = files.filter((file) => !namesToRemove.includes(file.name));
    onRemoveFiles?.(filesToRemove);
  };
</script>

<div>
  <div
    class="dropbox"
    class:dropbox-dragged-over={isDraggedOver}
    class:disabled
    onclick={onDropzoneClick}
    ondrop={onDrop}
    ondragover={(event) => {
      event.preventDefault();
      if (!disabled) {
        isDraggedOver = true;
      }
    }}
    ondragleave={(event) => {
      event.preventDefault();
      isDraggedOver = false;
    }}
    role="button"
    tabindex="0"
    onkeydown={(event) => {
      if (event.key === "Enter" || event.key === " ") {
        onDropzoneClick(event as unknown as MouseEvent);
      }
    }}
  >
    <input bind:this={fileInput} type="file" style="display: none" multiple onchange={onFilesChanged} />
    {#if error !== undefined}
      <div class="error-text" role="alert" aria-live="assertive">En feil har skjedd<br />{error}</div>
    {/if}
    <div class="dropbox-content">
      <img src={icon} style="width: 100px;" alt="upload-icon" />
      Dra og slipp eller trykk i feltet for å laste opp fil
      {#if files.length > 0 && showReset}
        <button
          type="button"
          class="ds-button"
          data-size="sm"
          onclick={(event) => {
            event.stopPropagation();
            reset();
          }}
        >
          Reset
        </button>
      {/if}
    </div>
  </div>

  {#if files.length > 0 && showList}
    <FileListDisplay {files} {disabled} onRemoveFiles={removeFiles} {onDownloadBlob} />
  {/if}
</div>

<style>
  .dropbox {
    outline: 2px dashed grey;
    outline-offset: -10px;
    background: #d1eae9;
    color: dimgray;
    padding: 10px;
    min-height: 200px;
    position: relative;
    cursor: pointer;
    border-radius: 20px;
    display: flex;
    justify-content: center;
    box-shadow: 0 1px 5px -1px #888888;
  }

  .dropbox.disabled {
    background-color: rgb(245, 245, 245);
    cursor: not-allowed;
  }

  .dropbox-dragged-over {
    background: lightblue;
    outline-color: aliceblue;
  }

  .dropbox-content {
    display: flex;
    align-items: center;
    flex-direction: column;
    margin-top: 1rem;
    margin-bottom: 0.5rem;
    gap: 1rem;
  }

  .error-text {
    color: firebrick;
    font-weight: 900;
  }
</style>
