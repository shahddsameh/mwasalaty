import { ref } from "vue";

export type ApiRequestOptions<TBody = unknown> = Omit<RequestInit, "body"> & {
  body?: TBody;
};

export class ApiRequestError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details: unknown) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.details = details;
  }
}

export function useApi() {
  const loading = ref(false);
  const error = ref<ApiRequestError | null>(null);

  async function request<TResponse, TBody = unknown>(
    url: string,
    options: ApiRequestOptions<TBody> = {},
  ): Promise<TResponse> {
    loading.value = true;
    error.value = null;

    try {
      const headers = new Headers(options.headers);
      let body: BodyInit | null | undefined;

      if (options.body instanceof FormData) {
        body = options.body;
      } else if (options.body !== undefined) {
        headers.set("Content-Type", headers.get("Content-Type") ?? "application/json");
        body = JSON.stringify(options.body);
      }

      const response = await fetch(url, {
        ...options,
        headers,
        body,
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new ApiRequestError(
          payload?.error?.message ?? payload?.message ?? "Request failed.",
          response.status,
          payload,
        );
      }

      return payload as TResponse;
    } catch (err) {
      error.value =
        err instanceof ApiRequestError
          ? err
          : new ApiRequestError(
              err instanceof Error ? err.message : "Request failed.",
              0,
              err,
            );
      throw error.value;
    } finally {
      loading.value = false;
    }
  }

  return {
    loading,
    error,
    request,
    get: <TResponse>(url: string, options?: ApiRequestOptions) =>
      request<TResponse>(url, { ...options, method: "GET" }),
    post: <TResponse, TBody = unknown>(
      url: string,
      body: TBody,
      options?: ApiRequestOptions,
    ) => request<TResponse, TBody>(url, { ...options, method: "POST", body }),
  };
}
