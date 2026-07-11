import axios from 'axios';

const API_KEY = process.env.TIGER_SMS_API_KEY;
const BASE_URL = 'https://api.tiger-sms.com/stubs/handler_api.php';

if (!API_KEY) throw new Error('TIGER_SMS_API_KEY is not set');

async function tigerRequest(action: string, params: Record<string, any> = {}) {
  const res = await axios.get(BASE_URL, {
    params: { api_key: API_KEY, action, ...params }
  });
  
  // Handle TigerSMS error strings
  if (typeof res.data === 'string' && res.data.startsWith('ERROR')) {
    throw new Error(res.data);
  }
  return res.data;
}

export async function getCountries() {
  const data = await tigerRequest('getCountries');
  
  // Parse countries - handle both {id: "name"} and {id: {title: "name"}} formats
  return Object.entries(data).map(([id, value]: [string, any]) => ({
    id,
    name: typeof value === 'string' 
      ? value 
      : (value.title || value.name || value.country || `Country ${id}`)
  })).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getServices(countryId: string) {
  const data = await tigerRequest('getPricesV3', { country: countryId });
  
  return Object.entries(data)
    .filter(([_, info]: [string, any]) => {
      const count = typeof info === 'object' ? info.count : 0;
      return count > 0;
    })
    .map(([service, info]: [string, any]) => ({
      service,
      name: typeof info === 'object' ? (info.title || service.toUpperCase()) : service.toUpperCase(),
      price: typeof info === 'object' ? parseFloat(info.cost || info.price || 0) : 0,
      count: typeof info === 'object' ? info.count : 0
    }))
    .sort((a, b) => a.price - b.price);
}

export async function buyNumber(countryId: string, service: string) {
  const data = await tigerRequest('getNumber', { country: countryId, service });
  
  if (typeof data === 'string') throw new Error(data);
  if (!data.activationId || !data.number) throw new Error('Failed to get number');
  
  return { id: data.activationId, number: data.number };
}

export async function checkSms(activationId: string) {
  const data = await tigerRequest('getStatus', { id: activationId });
  
  if (typeof data === 'object' && data.code) {
    return { status: 'completed', sms: data.code };
  }
  return { status: data, sms: null };
}
