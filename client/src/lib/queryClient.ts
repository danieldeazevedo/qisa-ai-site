import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Generate unique session ID per browser
function getUserSessionId(): string {
  let sessionId = localStorage.getItem('qisa-user-session-id');
  if (!sessionId) {
    sessionId = 'user-' + Math.random().toString(36).substr(2, 16) + '-' + Date.now();
    localStorage.setItem('qisa-user-session-id', sessionId);
  }
  return sessionId;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};
  
  // Add unique session ID for personal chats
  headers['x-user-session'] = getUserSessionId();
  
  // Add username if user is authenticated
  const currentUser = JSON.parse(localStorage.getItem('qisa_user') || 'null');
  if (currentUser?.username) {
    headers['x-username'] = currentUser.username;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const headers: Record<string, string> = {};
    
    // Add unique session ID for personal chats
    headers['x-user-session'] = getUserSessionId();
    
    // Add username if user is authenticated
    const currentUser = JSON.parse(localStorage.getItem('qisa_user') || 'null');
    if (currentUser?.username) {
      headers['x-username'] = currentUser.username;
    }

    const res = await fetch(queryKey.join("/") as string, {
      headers,
      credentials: "include",
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
