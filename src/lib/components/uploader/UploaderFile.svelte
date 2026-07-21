<script lang="ts">
  import FileIcon from "./FileIcon.svelte";

  type Props = {
    file: { name: string };
  };

  let { file }: Props = $props();
</script>

<div class="file-container">
  <FileIcon filename={file.name} />
  <p class="filename">{file.name}</p>
</div>

<style>
  .file-container {
    text-overflow: ellipsis;
    overflow: hidden;
  }

  .filename {
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }
</style>
