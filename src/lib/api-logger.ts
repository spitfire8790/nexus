interface ApiLogOptions {
  method?: string;
  url: string;
  data?: any;
}

export async function loggedFetch(options: ApiLogOptions) {
  const { method = 'GET', url, data } = options;
  
  // Log request
  console.group(`🌐 API Request: ${method} ${url}`);
  console.log('Request URL:', url);
  if (data) {
    console.log('Request Data:', data);
  }
  
  try {
    const response = await fetch(url);
    const responseData = await response.json();
    
    // Log response
    console.log('Response Status:', response.status);
    console.log('Response Data:', responseData);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    console.groupEnd();
    return responseData;
  } catch (error) {
    console.error('Error:', error);
    console.groupEnd();
    throw error;
  }
}