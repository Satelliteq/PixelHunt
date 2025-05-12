import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  increment, 
  serverTimestamp,
  DocumentData,
  QueryDocumentSnapshot,
  FirestoreDataConverter
} from 'firebase/firestore';
import { 
  getAllCategories, 
  getCategory, 
  getImage, 
  getImagesByCategory,
  getRandomImage,
  getTest,
  getTestByUuid,
  getAllTests,
  getPopularTests,
  getNewestTests,
  getFeaturedTests,
  searchTests,
  checkAnswer,
  saveGameScore
} from './firebaseHelpers';

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  urlOrOptions: string | {
    url: string;
    method?: string;
    data?: unknown;
    headers?: Record<string, string>;
  }
): Promise<any> {
  let url: string;
  let method: string = 'GET';
  let data: unknown;
  let customHeaders: Record<string, string> = {};
  
  if (typeof urlOrOptions === 'string') {
    url = urlOrOptions;
  } else {
    url = urlOrOptions.url;
    method = urlOrOptions.method || 'GET';
    data = urlOrOptions.data;
    customHeaders = urlOrOptions.headers || {};
  }
  
  // Firebase API endpoints
  if (url.startsWith('/api/')) {
    try {
      // Map API endpoints to Firebase functions
      if (url === '/api/categories') {
        return await getAllCategories();
      }
      
      if (url.startsWith('/api/categories/') && url !== '/api/categories/') {
        const id = url.split('/').pop() || '';
        return await getCategory(id);
      }
      
      if (url === '/api/images') {
        // This would need to be implemented in firebaseHelpers.ts
        // For now, return an empty array
        return [];
      }
      
      if (url.startsWith('/api/images/category/')) {
        const categoryId = url.split('/').pop() || '';
        return await getImagesByCategory(categoryId);
      }
      
      if (url.startsWith('/api/images/') && !url.includes('/category/')) {
        const id = url.split('/').pop() || '';
        return await getImage(id);
      }
      
      if (url === '/api/game/random-image') {
        // Extract category ID from query params if present
        const categoryId = url.includes('?categoryId=') 
          ? url.split('?categoryId=')[1] 
          : undefined;
        return await getRandomImage(categoryId);
      }
      
      if (url === '/api/game/check-answer' && method === 'POST') {
        const { imageId, answer } = data as { imageId: string, answer: string };
        const isCorrect = await checkAnswer(imageId, answer);
        return { isCorrect };
      }
      
      if (url === '/api/game/scores' && method === 'POST') {
        return await saveGameScore(data as any);
      }
      
      if (url === '/api/tests') {
        // Check if this is a search request
        if (url.includes('?q=') || url.includes('?categoryId=')) {
          const searchQuery = url.includes('?q=') 
            ? url.split('?q=')[1].split('&')[0] 
            : '';
          const categoryId = url.includes('?categoryId=') 
            ? url.split('?categoryId=')[1].split('&')[0] 
            : undefined;
          return await searchTests(searchQuery, categoryId);
        }
        
        // If it's a POST request, create a new test
        if (method === 'POST') {
          // This would need to be implemented in firebaseHelpers.ts
          // For now, throw an error
          throw new Error('Test creation not implemented');
        }
        
        // Otherwise, get all tests
        return await getAllTests();
      }
      
      if (url.startsWith('/api/tests/') && url.includes('/comments')) {
        // This would need to be implemented in firebaseHelpers.ts
        // For now, return an empty array
        return [];
      }
      
      if (url === '/api/tests/popular') {
        const limitParam = url.includes('?limit=') 
          ? parseInt(url.split('?limit=')[1]) 
          : 5;
        return await getPopularTests(limitParam);
      }
      
      if (url === '/api/tests/newest') {
        const limitParam = url.includes('?limit=') 
          ? parseInt(url.split('?limit=')[1]) 
          : 5;
        return await getNewestTests(limitParam);
      }
      
      if (url === '/api/tests/featured') {
        const limitParam = url.includes('?limit=') 
          ? parseInt(url.split('?limit=')[1]) 
          : 5;
        return await getFeaturedTests(limitParam);
      }
      
      if (url.startsWith('/api/tests/category/')) {
        const categoryId = url.split('/').pop() || '';
        // This would need to be implemented in firebaseHelpers.ts
        // For now, return an empty array
        return [];
      }
      
      if (url.startsWith('/api/tests/') && !url.includes('/comments') && !url.includes('/category/')) {
        const id = url.split('/').pop() || '';
        
        // Check if this is a UUID or an ID
        if (id.length > 8 && isNaN(parseInt(id))) {
          return await getTestByUuid(id);
        } else {
          return await getTest(id);
        }
      }
      
      // If no matching endpoint, throw an error
      throw new Error(`Endpoint not implemented: ${url}`);
    } catch (error) {
      console.error(`Error in Firebase API request to ${url}:`, error);
      throw error;
    }
  }
  
  // For non-Firebase endpoints, use fetch
  const headers: Record<string, string> = {
    ...customHeaders
  };
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
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
    
    try {
      return await apiRequest(url);
    } catch (error) {
      if (unauthorizedBehavior === "returnNull" && error instanceof Error && error.message.includes('401')) {
        return null;
      }
      throw error;
    }
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