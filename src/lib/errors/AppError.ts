export type ErrorLike = Error & {
  statusCode?: number;
  status?: number;
  errors?: string[];
  title?: string;
  response?: {
    data?: {
      title?: string;
      message?: string;
      errors?: string | string[];
      stack?: string;
    };
  };
};

export class AppError extends Error {
  readonly title: string;
  readonly errors: string[] | undefined;

  constructor(title: string, message?: string, errors?: string[]) {
    super(message);
    this.title = title;
    this.errors = errors && errors.length > 0 ? errors : undefined;
  }
}
