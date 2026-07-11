import axios from 'axios';

const API_KEY = process.env.TIGER_SMS_API_KEY;
const BASE_URL = process.env.TIGER_SMS_BASE_URL || 'https://tigersms.com/api';

if (!API_KEY) throw new Error('TIGER_SMS_API_KEY is not set');

export async function getCountries() {
  const res = await axios.get(`${BASE_URL}/getCountries`, { 
    params: { api_key: API_KEY } 
  });
  return res.data.sort((a: any, b: any) => a.name.localeCompare(b.name));
}

export async function getServices(countryCode: string) {
  const res = await axios.get(`${BASE_URL}/getNumbersStatus`, { 
    params: { api_key: API_KEY, country: countryCode } 
  });
  // Filter out services with 0 count and sort by price
  return res.data
    .filter((s: any) => s.count > 0)
    .sort((a: any, b: any) => parseFloat(a.price) - parseFloat(b.price));
}

export async function buyNumber(countryCode: string, serviceId: string) {
  const res = await axios.get(`${BASE_URL}/getNumber`, { 
    params: { api_key: API_KEY, country: countryCode, service: serviceId } 
  });
  if (res.data.error) throw new Error(res.data.error);
  if (!res.data.number || !res.data.id) throw new Error('Invalid response from TigerSMS');
  return res.data;
}

export async function checkSms(orderId: string) {
  const res = await axios.get(`${BASE_URL}/getStatus`, { 
    params: { api_key: API_KEY, id: orderId } 
  });
  // Returns 'STATUS_WAIT_CODE', 'STATUS_OK', or 'STATUS_CANCEL'
  return { status: res.data.status, sms: res.data.sms || null };
}
