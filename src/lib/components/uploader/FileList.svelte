<script lang="ts">
  import type { UploadedFileData } from "$lib/uploader/types";
  import FileIcon from "./FileIcon.svelte";

  type Props = {
    files: UploadedFileData[];
    disabled?: boolean;
    onRemoveFiles?: (files: UploadedFileData[]) => void;
    onDownloadBlob?: (file: UploadedFileData) => void;
  };

  let { files, disabled = false, onRemoveFiles, onDownloadBlob }: Props = $props();

  const removeFile = (file: UploadedFileData): void => {
    if (!confirm(`Er du helt sikker på at du ønsker å fjerne filen ${file.name}?`)) {
      return;
    }
    onRemoveFiles?.([file]);
  };

  const downloadFile = (file: UploadedFileData): void => {
    if (file.dataUrl) {
      const link = document.createElement("a");
      link.href = file.dataUrl;
      link.setAttribute("download", file.name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      return;
    }

    onDownloadBlob?.(file);
  };
</script>

<div class="wrapper">
  <table style="width: 100%; border-collapse: collapse;">
    <tbody>
      {#each files as file (file.name)}
        <tr class="table-row">
          <td class="file-row">
            <FileIcon filename={file.name} onClick={() => downloadFile(file)} />
            <div>{file.name}</div>
            <div class="row-actions">
              {#if file.tags}
                {#each file.tags as tag (tag)}
                  <span class="ds-tag">{tag}</span>
                {/each}
              {/if}
              <button type="button" class="icon-btn" onclick={() => removeFile(file)} {disabled} aria-label="Slett fil">🗑️</button>
            </div>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .wrapper {
    background-color: #bacdd4;
    border-bottom-left-radius: 10px;
    border-bottom-right-radius: 10px;
  }

  .table-row:nth-child(even) {
    background-color: #d5e1e5;
  }

  .file-row {
    display: flex;
    align-items: center;
    padding: 0.3rem 0.8rem;
    gap: 0.5rem;
  }

  .row-actions {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }

  .icon-btn {
    width: 1.9rem;
    height: 1.9rem;
    font-size: 0.8rem;
    border-radius: 50%;
    border: none;
    background-color: #fafafa;
    box-shadow:
      0 3px 1px -2px rgba(0, 0, 0, 0.2),
      0 2px 2px 0 rgba(0, 0, 0, 0.14),
      0 1px 5px 0 rgba(0, 0, 0, 0.12);
    transition: background-color 0.1s;
    cursor: pointer;
  }

  .icon-btn:hover {
    background-color: #efefef;
  }

  .icon-btn:disabled {
    cursor: not-allowed;
  }

  table {
    border-bottom-left-radius: 10px;
    border-bottom-right-radius: 10px;
  }

  table tr:last-child td:first-child {
    border-bottom-left-radius: 10px;
  }

  table tr:last-child td:last-child {
    border-bottom-right-radius: 10px;
  }
</style>
