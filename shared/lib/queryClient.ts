import { QueryClient } from '@tanstack/react-query';

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorText;
    try {
      const data = await res.json();
      errorText = data.message || data.error || res.statusText;
    } catch (e) {
      errorText = res.statusText;
    }
    const error = new Error(`Request failed: ${errorText}`);
    (error as any).status = res.status;
    throw error;
  }
}

export async function apiRequest<TData = any>(
  url: string,
  options: RequestInit = {}
): Promise<TData> {
  const defaultOptions: RequestInit = {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const mergedOptions: RequestInit = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  if (options.method && options.method.toUpperCase() !== 'GET' && options.body) {
    (mergedOptions as any).body =
      typeof options.body === 'string'
        ? options.body
        : JSON.stringify(options.body);
  }

  const response = await fetch(url, mergedOptions);
  await throwIfResNotOk(response);

  // Return empty object if no content
  if (response.status === 204) {
    return {} as TData;
  }

  return response.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn = <TData>(options: {
  on401: UnauthorizedBehavior;
}) => {
  return async ({ queryKey }: { queryKey: string[] }): Promise<TData | null> => {
    try {
      const [url] = queryKey;
      return await apiRequest<TData>(url);
    } catch (error: any) {
      if (error?.status === 401 && options.on401 === "returnNull") {
        return null;
      }
      throw error;
    }
  };
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60, // 1 hour
      retry: 1,
      queryFn: getQueryFn<unknown>({ on401: "throw" }),
    },
  },
});