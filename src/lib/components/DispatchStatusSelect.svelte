<script lang="ts">
  import type { DispatchStatus } from "$lib/dispatch/types";

  type StatusItem = {
    text: string;
    value: string;
    color: string;
    hint?: string;
  };

  type Props = {
    value: string;
    disabled?: boolean;
    onChange?: (value: DispatchStatus) => void;
  };

  let { value, disabled = false, onChange }: Props = $props();

  const ALL_ITEMS: StatusItem[] = [
    { text: "Under Behandling", value: "notapproved", color: "#E7827E", hint: "Utsendelsen vil ikke gjennomføres før den er godkjent" },
    { text: "Godkjent", value: "approved", color: "#D0C788", hint: "Utsendelsen låses 00:00 og sendes i morgen mellom 12:00 og 13:00" }
  ];

  const items = $derived.by((): StatusItem[] => {
    if (value === "completed") {
      return [{ text: "Fullført", value: "completed", color: "#91B99F", hint: "Utsendelsen er gjennomført" }];
    }
    if (value === "inprogress") {
      return [{ text: "Utsendelse Pågår", value: "inprogress", color: "#E0C38B", hint: "Utsendelsen kjører nå" }];
    }
    return ALL_ITEMS;
  });

  const selectedItem = $derived(items.find((item) => item.value === value) ?? { text: "Ukjent", value: "unknown", color: "#555555" });
  const isLocked = $derived(disabled || value === "completed" || value === "inprogress");
</script>

<div class="status-select">
  <label class="ds-label" for="dispatch-status-select">Sett status for prosjektet</label>
  <select
    id="dispatch-status-select"
    class="ds-input"
    style="background-color: {selectedItem.color};"
    value={selectedItem.value}
    disabled={isLocked}
    onchange={(event) => onChange?.(event.currentTarget.value as DispatchStatus)}
  >
    {#each items as item (item.value)}
      <option value={item.value}>{item.text}</option>
    {/each}
  </select>
  {#if selectedItem.hint}
    <strong>{selectedItem.hint}</strong>
  {/if}
</div>

<style>
  .status-select {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    width: 350px;
  }

  select {
    border-radius: 999px;
    font-weight: 600;
  }
</style>
