<script lang="ts">
  type StatItem = {
    text: string;
    value: string | number;
    postvalue?: string;
  };

  type Props = {
    items?: StatItem[];
  };

  const DEFAULT_ITEMS: StatItem[] = [
    { text: "Private", value: "100" },
    { text: "Bedrifter", value: "79" },
    { text: "Borettslag", value: "3" }
  ];

  let { items = DEFAULT_ITEMS }: Props = $props();
</script>

<div class="card-container">
  {#each items as item (item.text)}
    <div class="card">
      <div class="card-header">
        <h2 class="ds-heading" data-size="sm">{item.text}</h2>
      </div>
      <div class="card-body">
        <p class="ds-heading" data-size="md">
          {item.value}
          {#if item.postvalue}<span>{item.postvalue}</span>{/if}
        </p>
      </div>
    </div>
  {/each}
</div>

<style>
  .card-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 2rem;
    width: 100%;
  }

  .card {
    display: flex;
    flex-direction: column;
    height: 200px;
    width: 200px;
    background-color: #cfebf2;
    padding: 1rem;
    border-radius: 10px;
    box-shadow: 0 1px 5px 1px #888888;
  }

  .card-header {
    flex: 0;
  }

  .card-body {
    display: flex;
    justify-content: center;
    align-items: center;
    flex: 0 1 auto;
    height: 100%;
    width: 100%;
  }
</style>
