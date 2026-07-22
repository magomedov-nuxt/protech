type AdminFetchOptions = Omit<NonNullable<Parameters<typeof $fetch>[1]>, "headers"> & {
  headers?: Record<string, string>;
};

export function adminFetch<T>(request: string, options: AdminFetchOptions = {}) {
  return $fetch<T>(request, {
    credentials: "include",
    ...options,
    headers: {
      ...(import.meta.server ? useRequestHeaders(["cookie"]) : {}),
      ...(options.headers ?? {})
    }
  });
}