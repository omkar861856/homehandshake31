// Utility functions for API calls with profile key

export interface ApiCallOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: any;
  headers?: Record<string, string>;
}

export async function apiCallWithProfileKey(
  endpoint: string,
  profileKey: string,
  options: ApiCallOptions = {}
): Promise<any> {
  const { method = "GET", body, headers = {} } = options;

  const requestOptions: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      "profile-key": profileKey,
      ...headers,
    },
  };

  if (body && method !== "GET") {
    requestOptions.body = JSON.stringify(body);
  }

  const response = await fetch(endpoint, requestOptions);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// Specific API functions
export async function fetchVideoClips(profileKey: string) {
  return apiCallWithProfileKey("/api/video-clips", profileKey);
}

export async function fetchAnalytics(profileKey: string) {
  return apiCallWithProfileKey("/api/ayrshare/analytics", profileKey);
}

export async function fetchUserData(profileKey: string) {
  return apiCallWithProfileKey("/api/ayrshare/user", profileKey);
}

export async function postVideo(profileKey: string, data: any) {
  return apiCallWithProfileKey("/api/webhook-proxy", profileKey, {
    method: "POST",
    body: data,
  });
}


