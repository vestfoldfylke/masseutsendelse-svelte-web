<script lang="ts">
  import type { UploadedFileData } from "$lib/uploader/types";
  import UploadField from "../uploader/UploadField.svelte";

  type Props = {
    onUploaded: (files: UploadedFileData[]) => void;
  };

  let { onUploaded }: Props = $props();
</script>

<div class="upload-step">
  <div class="header-row">
    <h2 class="ds-heading" data-size="md">Last opp polygonet (Tillatte filtyper: '.dxf' og '.kml')</h2>
    <details class="ds-details">
      <summary>Vis tillatte soner</summary>
      <div>
        <div class="rec">
          <h3 class="ds-heading" data-size="sm">For best resultat anbefales: EUREF89 UTM Sone 32</h3>
        </div>
        <div class="list">
          <ul>
            <li>NGO1948 Gauss-K. Akse 1</li>
            <li>NGO1948 Gauss-K. Akse 2</li>
            <li>NGO1948 Gauss-K. Akse 3</li>
            <li>NGO1948 Gauss-K. Akse 4</li>
            <li>NGO1948 Gauss-K. Akse 5</li>
            <li>NGO1948 Gauss-K. Akse 6</li>
            <li>NGO1948 Gauss-K. Akse 7</li>
            <li>NGO1948 Gauss-K. Akse 8</li>
            <li>NGO1948 Geografisk</li>
          </ul>
          <ul>
            <li>EDM UTM Sone 31</li>
            <li>EDM UTM Sone 32</li>
            <li>EDM UTM Sone 33</li>
            <li>EDM UTM Sone 34</li>
            <li>EDM UTM Sone 35</li>
            <li>EDM UTM Sone 36</li>
          </ul>
          <ul>
            <li>EUREF89 UTM Sone 31</li>
            <li class="highlighted">EUREF89 UTM Sone 32</li>
            <li>EUREF89 UTM Sone 33</li>
            <li>EUREF89 UTM Sone 34</li>
            <li>EUREF89 UTM Sone 35</li>
            <li>EUREF89 UTM Sone 36</li>
          </ul>
          <ul>
            <li>ED50 Geografisk</li>
            <li>Møre A</li>
            <li>Møre B</li>
            <li>EUREF89 Geografisk (Long, lat)</li>
            <li>NGO 56A (Møre)</li>
            <li>NGO 56B (Møre)</li>
          </ul>
        </div>
      </div>
    </details>
  </div>

  <UploadField {onUploaded} convertDataToDataUrl={false} allowedExtensions={["dxf", "kml"]} />
</div>

<style>
  .upload-step {
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }

  .ds-details[open] {
    border-bottom: 0;
  }

  .ds-details > :not(summary):last-child {
    margin-block-start: 0;
    margin-block-end: 0;
  }

  .header-row {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .rec {
    background-color: #f8f6f0;
    display: flex;
    justify-content: center;
    padding-top: 1rem;
    padding-bottom: 1rem;
  }

  .list {
    background-color: #f8f6f0;
    display: flex;
    justify-content: space-around;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom-right-radius: 1rem;
    border-bottom-left-radius: 1rem;
  }

  .highlighted {
    background-color: lightgreen;
  }
</style>
