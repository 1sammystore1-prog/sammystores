import axios from 'axios';

const BASE_URL = 'https://www.danotp.com.ng/api/v2';

export async function smmRequest(action: string, params: Record<string, any> = {}) {
  const apiKey = process.env.YOUR_DANOTP_API_KEY;
  
  if (!apiKey) {
    throw new Error('API key not configured');
  }

  // Note: SMM API uses 'key' instead of 'api_key'
  const response = await axios.get(BASE_URL, {
    params: {
      action,
      key: apiKey,
      ...params
    }
  });

  return response.data;
}
