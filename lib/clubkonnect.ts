import axios from 'axios';

const BASE_URL = 'https://www.nellobytesystems.com';

function credentials() {
  const userId = process.env.CLUBKONNECT_USER_ID;
  const apiKey = process.env.CLUBKONNECT_API_KEY;
  if (!userId || !apiKey) {
    throw new Error('Clubkonnect UserID/API key not configured');
  }
  return { UserID: userId, APIKey: apiKey };
}

async function clubkonnectRequest(path: string, params: Record<string, any> = {}) {
  const response = await axios.get(`${BASE_URL}${path}`, {
    params: { ...credentials(), ...params }
  });
  const data = response.data;
  if (data && typeof data === 'object' && typeof data.status === 'string') {
    const errorStatuses = [
      'INVALID_CREDENTIALS', 'MISSING_CREDENTIALS', 'MISSING_USERID', 'MISSING_APIKEY',
      'MISSING_PHONE_NUMBER', 'INVALID_RECIPIENT', 'ORDER_FAILED', 'INSUFFICIENT_BALANCE',
      'INVALID_NETWORK', 'INVALID_DATA_PLAN', 'INVALID_AMOUNT',
    ];
    if (errorStatuses.includes(data.status)) {
      throw new Error(`Clubkonnect error: ${data.status}`);
    }
  }
  return data;
}

export interface ClubkonnectPlan {
  network: string;
  networkId: string;
  code: string;
  name: string;
  price: number;
}

let planCache: { plans: ClubkonnectPlan[]; expiresAt: number } | null = null;
const PLAN_CACHE_TTL_MS = 5 * 60 * 1000;

export async function getDataPlans(): Promise<ClubkonnectPlan[]> {
  if (planCache && planCache.expiresAt > Date.now()) return planCache.plans;

  const data = await clubkonnectRequest('/APIDatabundlePlansV2.asp');
  const networks = data?.MOBILE_NETWORK || {};
  const plans: ClubkonnectPlan[] = [];

  for (const networkName of Object.keys(networks)) {
    const entries = Array.isArray(networks[networkName]) ? networks[networkName] : [];
    for (const entry of entries) {
      const networkId = String(entry.ID);
      const products = Array.isArray(entry.PRODUCT) ? entry.PRODUCT : [];
      for (const product of products) {
        plans.push({
          network: networkName,
          networkId,
          code: String(product.PRODUCT_CODE),
          name: product.PRODUCT_NAME,
          price: parseFloat(product.PRODUCT_AMOUNT),
        });
      }
    }
  }

  planCache = { plans, expiresAt: Date.now() + PLAN_CACHE_TTL_MS };
  return plans;
}

const APP_NETWORK_NAMES: Record<string, string> = {
  '1': 'MTN',
  '2': 'GLO',
  '3': 'AIRTEL',
  '4': '9MOBILE',
};

export async function resolveNetworkId(appNetworkId: string): Promise<string> {
  const targetName = APP_NETWORK_NAMES[appNetworkId];
  if (!targetName) throw new Error('Unknown network');

  const plans = await getDataPlans();
  const match = plans.find((p) => p.network.toUpperCase().includes(targetName));
  if (!match) throw new Error(`Could not resolve network ID for ${targetName}`);
  return match.networkId;
}

export async function buyAirtime(clubkonnectNetworkId: string, amount: number, mobileNumber: string, requestId: string) {
  return clubkonnectRequest('/APIAirtimeV1.asp', {
    MobileNetwork: clubkonnectNetworkId,
    Amount: amount,
    MobileNumber: mobileNumber,
    RequestID: requestId,
  });
}

export async function buyDataBundle(clubkonnectNetworkId: string, planCode: string, mobileNumber: string, requestId: string) {
  return clubkonnectRequest('/APIDatabundleV1.asp', {
    MobileNetwork: clubkonnectNetworkId,
    DataPlan: planCode,
    MobileNumber: mobileNumber,
    RequestID: requestId,
  });
}

export async function getWalletBalance() {
  return clubkonnectRequest('/APIWalletBalanceV1.asp');
}
