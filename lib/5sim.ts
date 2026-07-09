import axios from 'axios';

const BASE_URL = 'https://5sim.net/v1';

export async function fiveSimRequest(endpoint: string, method: 'GET' | 'POST' = 'GET', params: any = {}) {
  const apiKey = process.env.FIVESIM_API_KEY;
  
  if (!apiKey) throw new Error('5sim API key not configured');

  const config: any = {
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/json'
    }
  };

  if (method === 'GET' && Object.keys(params).length > 0) {
    config.params = params;
  } else if (method === 'POST') {
    config.data = params;
  }

  const response = await axios(config);
  return response.data;
}
