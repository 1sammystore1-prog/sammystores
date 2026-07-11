import axios from 'axios';

const API_KEY = process.env.TIGER_SMS_API_KEY;
const BASE_URL = process.env.TIGER_SMS_BASE_URL || 'https://api.tiger-sms.com/stubs/handler_api.php';

if (!API_KEY) throw new Error('TIGER_SMS_API_KEY is not set');

async function tigerRequest(action: string, params: Record<string, any> = {}) {
  const res = await axios.get(BASE_URL, {
    params: { api_key: API_KEY, action, ...params }
  });
  
  // Tiger-SMS returns errors as strings like "ERROR_NO_BALANCE"
  if (typeof res.data === 'string' && res.data.startsWith('ERROR')) {
    throw new Error(res.data);
  }
  return res.data;
}

export async function getCountries() {
  const data = await tigerRequest('getCountries');
  
  console.log('Raw countries data:', JSON.stringify(data).substring(0, 500));
  
  // Tiger-SMS returns object { "6": "Russia", "12": "Ukraine", ... }
  // OR it might return { "6": { "title": "Russia", "name": "RU" }, ... }
  const countries = Object.entries(data).map(([id, value]: [string, any]) => {
    let name: string;
    
    if (typeof value === 'string') {
      // Simple format: { "6": "Russia" }
      name = value;
    } else if (typeof value === 'object' && value !== null) {
      // Complex format: { "6": { "title": "Russia", "name": "RU" } }
      name = value.title || value.name || value.country || id;
    } else {
      name = `Country ${id}`;
    }
    
    return {
      id,
      name: name.trim() || `Country ${id}`
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
  
  console.log('Processed countries:', countries.slice(0, 3));
  
  return countries;
}

export async function getServices(countryId: string) {
  const data = await tigerRequest('getPricesV3', { country: countryId });
  
  console.log('Raw services data for country', countryId, ':', JSON.stringify(data).substring(0, 500));
  
  // Returns object { "tg": { "cost": 5.5, "count": 120 }, ... }
  const services = Object.entries(data)
    .filter(([_, info]: [string, any]) => {
      // Handle both formats: { count: 120 } or just a number
      const count = typeof info === 'object' ? info.count : 0;
      return count > 0;
    })
    .map(([service, info]: [string, any]) => {
      const price = typeof info === 'object' ? parseFloat(info.cost || info.price || 0) : 0;
      const count = typeof info === 'object' ? info.count : 0;
      
      return {
        service,
        name: info.title || service.toUpperCase(),
        price,
        count
      };
    })
    .sort((a, b) => a.price - b.price);
  
  console.log('Processed services:', services.slice(0, 3));
  
  return services;
}

export async function buyNumber(countryId: string, service: string) {
  const data = await tigerRequest('getNumber', { country: countryId, service });
  
  console.log('Buy response:', data);
  
  // Returns { "activationId": "557860099", "number": "+79991234567" } or error string
  if (typeof data === 'string') {
    throw new Error(data);
  }
  
  if (!data.activationId || !data.number) {
    throw new Error('Failed to get number - invalid response');
  }
  
  return { id: data.activationId, number: data.number };
}

export async function checkSms(activationId: string) {
  const data = await tigerRequest('getStatus', { id: activationId });
  
  console.log('SMS check response:', data);
  
  // Returns { "activationId": "...", "text": "Your code is 123456", "code": "123456" }
  // Or status string like "STATUS_WAIT_CODE"
  if (typeof data === 'object' && data.code) {
    return { status: 'completed', sms: data.code };
  }
  
  return { status: data, sms: null };
}
