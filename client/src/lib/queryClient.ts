// Re-export our shared queryClient implementation
import { QueryClient } from '@tanstack/react-query';

// Utility function to handle API responses consistently
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorText = '';
    try {
      const errorData = await res.json();
      errorText = errorData.message || errorData.error || res.statusText;
    } catch {
      errorText = res.statusText;
    }
    
    const error = new Error(errorText);
    if (res.status === 401) {
      // @ts-ignore
      error.code = 'UNAUTHORIZED';
    }
    throw error;
  }
}

// Generic API request function for data fetching
export async function apiRequest<T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  url: string,
  body?: any,
  customHeaders?: Record<string, string>
): Promise<T> {
  const isFormData = body instanceof FormData;
  
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...customHeaders,
  };
  
  const options: RequestInit = {
    method,
    headers,
    credentials: 'include', // Include cookies for auth
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  };
  
  const res = await fetch(url, options);
  await throwIfResNotOk(res);
  
  // Handle empty responses
  const text = await res.text();
  return text ? JSON.parse(text) : undefined;
}

// Type for defining unauthorized behavior
type UnauthorizedBehavior = "returnNull" | "throw";

// Query function generator for React Query
export const getQueryFn = <T>(options: {
  on401: UnauthorizedBehavior;
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
}) => 
  async (): Promise<T | null> => {
    try {
      return await apiRequest<T>(options.method || 'GET', options.url);
    } catch (e) {
      // @ts-ignore
      if (e.code === 'UNAUTHORIZED') {
        if (options.on401 === 'returnNull') {
          return null;
        }
        throw e;
      }
      throw e;
    }
  };

// Configure Query Client with default options
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});