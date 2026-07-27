<script lang="ts">
  import { page } from "$app/state";
  import headerLogo from "$lib/assets/header_logo.svg";
  import { uiState } from "$lib/state/uiState.svelte";

  type Props = {
    user: { name: string };
  };

  type MenuItem = {
    name: string;
    href: string;
    onClick?: () => void;
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

  const menuItems: MenuItem[] = [
    { name: "Ny utsendelse", href: "/" },
    { name: "Maler", href: "/maler" },
    { name: "Utsendelser", href: "/utsendelser" },
    { name: "Hjelp", href: "javascript:void(0)", onClick: () => (uiState.isGuideModalOpen = true) }
  ];
</script>

<div class="header">
  <div class="header-logo">
    <a href="/" class="logo-link">
      <img src={headerLogo} style="height: 2.5rem" alt="fylkesvåpen" />
    </a>
    <span>Masseutsendelse</span>
  </div>
  <nav>
    <ul>
      {#each menuItems as menuItem}
        <li>
          <a class="ds-paragraph ds-focus force-cursor" data-variant="default" data-size="md" class:active={page.url.pathname === menuItem.href} href={menuItem.href} onclick={menuItem.onClick}>{menuItem.name}</a>
        </li>
      {/each}
    </ul>
  </nav>
  <span
    class="ds-avatar"
    data-variant="circle"
    data-initials="{initials}"
    role="img"
    aria-label="small"
    data-size="sm"
  ></span>
</div>

<style>
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  .header-logo {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
  }

  .logo-link {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  nav {
    display: flex;
    align-items: center;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    gap: 0.75rem;
    display: flex;
  }

  li a {
    color: inherit;
    text-decoration: none;
    border-bottom: 3px solid transparent;
    padding-bottom: var(--ds-size-2);
    transition: .1s border-color ease-out;
  }

  .force-cursor {
    cursor: pointer;
  }

  li a:hover, li a:focus-visible {
    border-color: var(--ds-color-neutral-border-subtle);
  }

  li a.active {
    border-color: var(--ds-color-neutral-border-strong);
    font-weight: 600;
  }

  @media only screen and (max-width: 500px) {
    .header {
      flex-wrap: wrap;
      justify-content: center;
    }
  }
</style>
