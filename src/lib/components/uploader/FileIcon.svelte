<script lang="ts">
  const icons = import.meta.glob<string>("./fileicons/*.svg", { eager: true, import: "default", query: "?url" });
  const DEFAULT_ICON = "./fileicons/default.svg";

  type Props = {
    filename?: string;
    onClick?: () => void;
  };

  let { filename = "none", onClick }: Props = $props();

  const icon = $derived.by((): string => {
    if (!filename?.includes(".") || filename.endsWith(".")) {
      return icons[DEFAULT_ICON] as string;
    }

    const extension = filename.substring(filename.lastIndexOf(".") + 1);
    const path = `./fileicons/${extension}.svg`;
    return icons[path] ?? (icons[DEFAULT_ICON] as string);
  });
</script>

<button type="button" class="icon-button" onclick={() => onClick?.()}>
  <img src={icon} alt="" />
</button>

<style>
  .icon-button {
    display: block;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
  }

  .icon-button > img {
    width: 3rem;
  }
</style>
