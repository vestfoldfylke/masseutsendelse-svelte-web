import type { ErrorLike } from "$lib/errors/AppError";

type LoadingModalState = {
  title?: string;
  message?: string;
  submessage?: string;
  subsubmessage?: string;
};

class UiState {
  isGuideModalOpen = $state(false);
  previewPdfBase64: string | undefined = $state(undefined);
  globalError: ErrorLike | undefined = $state(undefined);
  loadingModal: LoadingModalState | undefined = $state(undefined);
}

export const uiState = new UiState();
