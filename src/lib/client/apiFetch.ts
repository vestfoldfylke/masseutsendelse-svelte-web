import { AppError } from "$lib/errors/AppError";

type ApiErrorBody = {
  title?: string;
  message?: string;
};

export const clientApiFetch = async <T>(path: string, init?: RequestInit): Promise<T> => {
  console.log("clientApiFetch:", init?.method ?? "GET", "--", path);
  if (init?.body) {
    console.log("clientApiFetch body:", init.body);
  }
  const response: Response = await fetch(path, init);

  if (!response.ok) {
    const errorBody: ApiErrorBody | undefined = await response.json().catch(() => undefined);
    console.error("clientApiFetch:", init?.method ?? "GET", "--", path, "--", errorBody);
    throw new AppError(errorBody?.title ?? "Feil ved kall til API", errorBody?.message ?? `${path} svarte med status ${response.status}`);
  }

  console.log("clientApiFetch:", response.status);
  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
};
