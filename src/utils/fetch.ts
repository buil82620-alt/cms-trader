/**
 * Safe fetch wrapper that handles JSON parsing errors
 */
export async function safeFetch(url: string, options?: RequestInit): Promise<Response> {
  const response = await fetch(url, options);
  
  // Check if response is ok
  if (!response.ok) {
    // Try to get error message from response
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } else {
        const text = await response.text();
        if (text) {
          errorMessage = text.substring(0, 200); // Limit error message length
        }
      }
    } catch (e) {
      // If we can't parse error, use status text
      console.error('Error parsing error response:', e);
    }
    throw new Error(errorMessage);
  }
  
  return response;
}

/**
 * Safe JSON parsing from response
 */
export async function safeJson<T = any>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  
  // Check if response is actually JSON
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    throw new Error(`Expected JSON but got ${contentType}. Response: ${text.substring(0, 200)}`);
  }
  
  // Check if response has content
  const contentLength = response.headers.get('content-length');
  if (contentLength === '0') {
    throw new Error('Response is empty');
  }
  
  try {
    const text = await response.text();
    if (!text || text.trim().length === 0) {
      throw new Error('Response body is empty');
    }
    return JSON.parse(text);
  } catch (error: any) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON response: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Combined safe fetch and JSON parse
 */
export async function fetchJson<T = any>(url: string, options?: RequestInit): Promise<T> {
  const response = await safeFetch(url, options);
  return safeJson<T>(response);
}

