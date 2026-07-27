import { AppError } from "$lib/errors/AppError";

type ApiErrorBody = {
  title?: string;
  message?: string;
};

export const clientApiFetch = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response: Response = await fetch(path, init);

  if (!response.ok) {
    const errorBody: ApiErrorBody | undefined = await response.json().catch(() => undefined);
    throw new AppError(errorBody?.title ?? "Feil ved kall til clientApiFetch", errorBody?.message ?? `${path} svarte med status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
};
