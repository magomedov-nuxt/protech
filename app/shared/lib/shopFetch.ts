type ShopFetchOptions = Omit<NonNullable<Parameters<typeof $fetch>[1]>, "headers"> & {
  forwardRequestHeaders?: boolean;
  headers?: Record<string, string | undefined>;
};

export function shopFetch<T>(request: string, options: ShopFetchOptions = {}) {
  const {
    forwardRequestHeaders = true,
    headers,
    ...fetchOptions
  } = options;

  return $fetch<T>(request, {
    credentials: "include",
    ...fetchOptions,
    headers: {
      ...(import.meta.server && forwardRequestHeaders ? useRequestHeaders(["cookie"]) : {}),
      ...(headers ?? {})
    }
  });
}