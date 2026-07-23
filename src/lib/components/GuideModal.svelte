<script lang="ts">
  import { uiState } from "$lib/state/uiState.svelte";

  let dialogElement: HTMLDialogElement | undefined = $state();

  $effect(() => {
    if (!dialogElement) {
      return;
    }

    if (uiState.isGuideModalOpen) {
      return dialogElement.showModal();
    }

    dialogElement.close();
  });

  const close = (): void => {
    uiState.isGuideModalOpen = false;
  };
</script>

<dialog bind:this={dialogElement} class="ds-dialog" data-placement="center" id="guide-modal" onclose={close} onclick={(event) => event.target === dialogElement && close()}>
  <div class="dialog-header">
    <h2 class="ds-heading" data-size="md">Guide</h2>
    <button class="ds-button close-dialog-button" data-icon="true" data-variant="tertiary" type="button" aria-label="Lukk dialogvindu" data-color="neutral" command="close" commandfor="guide-modal"></button>
  </div>

  <div class="overflow">
    <div class="guide-section">
      <h2 class="ds-heading" data-size="sm">Om siden</h2>
      <span class="error-text">Det er viktig at polygonet benytter koordinatsystem EUREF89 UTM Sone 32 og er av et gyldig format.</span>
    </div>

    <div class="guide-section">
      <h3 class="ds-heading" data-size="sm">Bruk av siden</h3>
      <p class="ds-paragraph">
        1. Last opp en polygon-fil<br />
        2. Verifiser at polygonet treffer korrekt på kartet<br />
        3. Trykk på <b>Hent matrikkelinformasjon</b> knappen<br />
        4. Verifiser at innhentet informasjon ser korrekt ut<br />
        5. Fyll ut informasjon om varslet som skal sendes ut til alle eiere<br />
        6. Trykk forhåndsvisning og kvitter ut at utsendelsen ser korrekt ut<br />
        7. Trykk <b>Send til godkjenning</b><br /><br />

        Utsendelsen vil så legges i en kø. Når utsendelsen er godkjent vil den sendes ut dagen etterpå mellom klokken 12:00 og 13:00.
      </p>
    </div>

    <div class="guide-section">
      <h3 class="ds-heading" data-size="sm">Se, redigere, slette</h3>
      <p class="ds-paragraph">
        For å kunne se tidligere utsendelser og utsendelser som ligger til behandling, kan du trykke på <b>Utsendelser</b>.<br /><br />

        Ønsker du å redigere en utsendelse, må du gå til <b>Utsendelser</b>.<br />
        Deretter trykker du på <b>blyanten</b> for utsendelsen du vil redigere.<br />
        I det nye vinduet vil du se hele utsendelsen:<br /><br />

        1. Kartet viser polygonet som har blitt lastet opp av brukeren som opprettet utsendelsen.<br />
        2. Tabellen <b>Eiere / Mottakere</b> vil vise hvem som har en eiendom som befinner seg innenfor polygonet.<br />
        &ensp;a. Legg også merke til at helt til høyre i tabellen vil du se et <b>minus</b> tegn eller et <b>pluss</b> tegn.<br />
        &ensp;&emsp;Ved å trykke på denne knappen kan du velge hvem som skal motta eller ikke motta et varsel.<br />
        &ensp;b. Tabellen <b>Ekskluderte mottakere</b> vil vise hvilke organisasjoner eller eiere som ikke vil motta et varsel.<br />
        &ensp;&emsp;Eiere / Mottakere som er fjernet vil vises i dene listen.<br />
        3. Masseutsendelse <br />
        &ensp;a. Her har du mulighet til å redigere status på utsendelsen.<br />
        &ensp;b. Du har mulighet til å endre <b>Prosjektnavn</b>, <b>Prosjektnummer</b> og <b>Arkivnummer</b>. Du kan også endre mal som varselet skal benytte.<br />
        4. Vedlegg <br />
        &ensp;a. Om det finnes vedlegg som tilhører utsendelsen vil du finne disse i en liste under opplastningsfeltet.<br />
        &ensp;b. Ønsker du å laste opp nye filer kan du enkelt trykke på opplastningsfeltet og velge den filen du ønsker å laste opp, eller dra inn en fil og slippe denne over opplastningsfeltet.<br />
        &ensp;c. Ønsker du å slette en fil fra utsendelsen kan du trykke på søppelkassen som befinner seg på høyre side av listen.<br />
        &ensp;d. Ønsker du å laste ned en fil kan du trykke på filikonet på venstre side.<br /><br />

        <span class="error-text">NB! Legg merke til at du ikke kan redigere en utsendelse som har status "Godkjent" eller "Fullført"</span><br />
      </p>
    </div>
  </div>
</dialog>

<style>
  dialog[open] {
    width: 80vw;
    height: 80vh;
    max-width: 80vw;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
  }

  .overflow {
    flex: 1;
    overflow: auto;
    text-align: left;
  }

  .guide-section {
    margin-bottom: 1rem;
  }

  .error-text {
    color: red;
  }
</style>
