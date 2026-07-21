<script lang="ts">
  import headerLogo from "$lib/assets/header_logo.svg";
  import { uiState } from "$lib/state/uiState.svelte";

  type Props = {
    user: { name: string };
  };

  let { user }: Props = $props();

  const firstName: string | undefined = $derived(user.name.includes(" ") ? user.name.split(" ")[0] : undefined);
  const lastName: string | undefined = $derived.by(() => {
    if (!firstName) {
      return undefined;
    }

    const parts: string[] = user.name.split(" ");
    return parts[parts.length - 1];
  });

  const initials: string = $derived(`${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`);
</script>

<div class="header">
  <a href="/" class="logo-link">
    <img src={headerLogo} style="height: 3rem" alt="fylkesvåpen" />
  </a>
  <div class="header-actions">
    <span class="ds-paragraph">{user.name}</span>
    <span class="ds-avatar" data-variant="circle" data-size="sm" data-initials={initials} role="img" aria-label={user.name}></span>
    <button type="button" popovertarget="header-menu" class="ds-button" data-variant="tertiary" data-icon aria-label="Meny">☰</button>
    <div id="header-menu" popover="auto" class="ds-dropdown">
      <ul>
        <li><button type="button" class="ds-button" data-variant="tertiary" onclick={() => (uiState.isGuideModalOpen = true)}>Hjelp</button></li>
        <li><a href="/utsendelser" class="ds-button" data-variant="tertiary">Utsendelser</a></li>
        <li><a href="/maler" class="ds-button" data-variant="tertiary">Maler</a></li>
      </ul>
    </div>
  </div>
</div>

<style>
  .header {
    display: flex;
    justify-content: space-between;
    width: 100%;
  }

  .header-actions {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
  }

  @media only screen and (max-width: 500px) {
    .header {
      flex-wrap: wrap;
      justify-content: center;
    }
  }
</style>
