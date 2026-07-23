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

<dialog bind:this={dialogElement} class="ds-dialog" data-placement="center" onclose={close} onclick={(event) => event.target === dialogElement && close()}>
  <div class="guide-header">
    <h2 class="ds-heading" data-size="md">Guide</h2>
    <button type="button" class="ds-button" data-variant="tertiary" onclick={close}>Lukk</button>
  </div>
  <div class="overflow">
    <h3 class="ds-heading" data-size="sm">Om siden</h3>
    <span class="error-text">Det er viktig at polygonet benytter koordinatsystem EUREF89 UTM Sone 32 og er av et gyldig format.</span>

    <h3 class="ds-heading" data-size="sm">Bruk av siden</h3>
    <p class="ds-paragraph">
      1. Last opp en polygon-fil<br />
      2. Verifiser at polygonet treffer korrekt på kartet<br />
      3. Trykk på "Hent matrikkelinformasjon" knappen<br />
      4. Verifiser at innhentet informasjon ser korrekt ut<br />
      5. Fyll ut informasjon om varslet som skal sendes ut til alle eiere<br />
      6. Trykk forhåndsvisning og kvitter ut at utsendelsen ser korrekt ut<br />
      7. Trykk Send til godkjenning<br />
      <br />
      Utsendelsen vil så legges i en kø. Når utsendelsen er godkjent vil den sendes ut dagen etterpå mellom klokken 12:00 og 13:00.
    </p>

    <h3 class="ds-heading" data-size="sm">Se, endre, slette</h3>
    <p class="ds-paragraph">
      For å kunne se dine tidligere prosjekter og prosjekter som ligger til behandling kan du trykke på "Alle utsendelser" <br />
      <br />
      Ønsker du å endre et prosjekt, må du første navigere til tabellen med alle utsendelsene. <br />
      Deretter trykker du på blyanten for å åpne et nytt vindu for å redigere prosjektet <br />
      I det nye vinduet vil du se hele prosjektet. <br /><br />
      1. Kartet viser polygonet som har blitt lastet opp av brukeren som opprettet prosjektet. <br />
      2. I tabellen «Eiere /Mottakere» vil du kunne se hvem som har en eiendom som befinner seg innenfor polygonet. <br />
      &ensp;a. Legg også merke til at helt til høyre i tabellen vil du se et minus tegn eller et pluss tegn. <br />
      &ensp;&emsp;Ved å trykke på denne knappen kan du velge hvem som skal motta eller ikke motta et varsel. <br />
      &ensp;b. Tabellen under vil vise hvilke organisasjoner eller eiere som ikke vil motta et varsel. <br />
      3. Masseutsendelse <br />
      &ensp;a. Her har du mulighet til å endre status på prosjektet. <br />
      &ensp;b. Du har mulighet til å endre Prosjektnavn, Prosjektnummer, Arkivnummer og velge en mal som varselet skal benytte. <br />
      <span class="error-text">&ensp;c. NB! Å velge en mal er ikke påkrevd. <br /></span>
      4. Vedlegg <br />
      &ensp;a. Om det finnes vedlegg som tilhører prosjektet vil du finne disse i en liste under opplastningsfeltet. <br />
      &ensp;b. Ønsker du å laste opp nye filer kan du enkelt trykke på opplastningsfeltet og velge den filen du ønsker å laste opp, eller dra inn en fil og slippe denne over opplastningsfeltet. <br />
      &ensp;c. Ønsker du å slette en fil fra prosjektet kan du trykke på søppelkassen som befinner seg på høyre side av listen. <br />
      &ensp;d. Ønsker du å laste ned en fil kan du trykke på filikonet på venstre side. <br />
      <br />
      <span class="error-text">NB! Legg merke til at du ikke kan redigere et prosjekt som har status "Godkjent" eller "Fullført"</span>
    </p>
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

  .guide-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .overflow {
    flex: 1;
    overflow: auto;
    text-align: left;
  }

  .error-text {
    color: red;
  }
</style>
