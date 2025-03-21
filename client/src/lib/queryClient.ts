import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  url: string,
  options?: {
    method?: string;
    data?: unknown;
    headers?: Record<string, string>;
  }
): Promise<any> {
  const method = options?.method || 'GET';
  const data = options?.data;
  const customHeaders: Record<string, string> = options?.headers || {};
  
  // Varsayılan başlıklar ve özel başlıkları birleştir
  const headers: Record<string, string> = {};
  
  // Eğer data varsa Content-Type ekle
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  // Admin endpoint'leri için token ekleyelim
  if (url.includes('/admin/')) {
    headers["x-admin-token"] = "admin-secret-token";
  }
  
  // Özel başlıkları ekle
  Object.keys(customHeaders).forEach(key => {
    headers[key] = customHeaders[key];
  });
  
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return await res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    const headers: Record<string, string> = {};
    
    // Admin endpoint'leri için token ekleyelim
    if (url.includes('/admin/')) {
      headers["x-admin-token"] = "admin-secret-token";
    }
    
    const res = await fetch(url, {
      credentials: "include",
      headers
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
