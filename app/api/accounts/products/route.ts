import { NextResponse } from 'next/server';
import { getMarkups, computeMarkup, toNgn } from '@/lib/pricing';
import { getAllListings as getAccszoneListings } from '@/lib/accszone';

function pickInstructions(obj: any): string | null {
  if (!obj) return null;
  return obj.instructions || obj.login_instructions || obj.guide || obj.description || obj.note || null;
}
function pickVideo(obj: any): string | null {
  if (!obj) return null;
  return obj.video || obj.video_url || obj.tutorial_url || obj.tutorial_video || obj.youtube_url || null;
}
function pickStock(obj: any): number | null {
  if (!obj) return null;
  // benotp's API always returns stock:null but puts the real available
  // count in an 'amount' field instead - confirmed from a live response.
  // Still check the other common variants as a fallback in case a
  // different product/category ever uses a different field.
  const candidates = [obj.stock, obj.quantity, obj.qty, obj.available, obj.count, obj.inventory, obj.amount];
  for (const c of candidates) {
    if (c === undefined || c === null || c === '') continue;
    const n = parseInt(String(c), 10);
    if (!isNaN(n)) return n;
  }
  return null;
}

async function fetchBenotpProducts(markupPercent: number): Promise<{ products: any[]; error: string | null }> {
  const apiKey = process.env.BENOTP_API_KEY;
  if (!apiKey) {
    return { products: [], error: 'BeNotp API key not configured' };
  }

  try {
    const url = `https://www.benotp.com/stubs/buy-accounts.php?action=getProducts&api_key=${apiKey}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    const text = await response.text();

    if (!response.ok) {
      return { products: [], error: `BeNotp HTTP ${response.status}` };
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return { products: [], error: 'BeNotp returned invalid JSON' };
    }

    let raw: any[] = [];
    if (Array.isArray(data)) {
      raw = data;
    } else if (data && typeof data === 'object') {
      if (Array.isArray(data.categories)) {
        data.categories.forEach((category: any) => {
          if (Array.isArray(category.products)) {
            category.products.forEach((product: any) => {
              raw.push({
                ...product,
                category: category.name,
                instructions: pickInstructions(product) || pickInstructions(category),
                video: pickVideo(product) || pickVideo(category),
                stock: pickStock(product),
              });
            });
          }
        });
      } else if (Array.isArray(data.products)) {
        raw = data.products.map((p: any) => ({
          ...p,
          instructions: pickInstructions(p),
          video: pickVideo(p),
          stock: pickStock(p),
        }));
      } else if (data.product && typeof data.product === 'object') {
        raw = [
          {
            ...data.product,
            instructions: pickInstructions(data.product),
            video: pickVideo(data.product),
            stock: pickStock(data.product),
          },
        ];
      }
    }

    // benotp's own prices are already NGN (it's a Nigerian-market provider),
    // unlike AccsZone below which prices in USD - no toNgn() conversion here.
    const products = raw.map((p: any) => ({
      ...p,
      id: `benotp_${p.id}`,
      source: 'benotp',
      price: computeMarkup(parseFloat(p.price) || 0, markupPercent),
    }));

    return { products, error: null };
  } catch (error: any) {
    return { products: [], error: error.message || 'BeNotp network error' };
  }
}

async function fetchAccszoneProducts(markupPercent: number): Promise<{ products: any[]; error: string | null }> {
  if (!process.env.ACCSZONE_API_KEY) {
    return { products: [], error: 'AccsZone API key not configured' };
  }

  try {
    const listings = await getAccszoneListings();
    const products = listings.map((listing: any) => ({
      id: `accszone_${listing.id}`,
      name: listing.title,
      category: listing.subcategory?.title || listing.category?.title || 'Other',
      // AccsZone prices in USD - convert to NGN before applying markup,
      // same conversion already used for the TigerSMS numbers feature.
      price: computeMarkup(toNgn(parseFloat(listing.price) || 0), markupPercent),
      stock: typeof listing.available_stock === 'number' ? listing.available_stock : null,
      instructions: listing.description || null,
      video: null,
      source: 'accszone',
    }));
    return { products, error: null };
  } catch (error: any) {
    return { products: [], error: error.message || 'AccsZone network error' };
  }
}

export async function GET() {
  const markups = await getMarkups();

  const [benotpResult, accszoneResult] = await Promise.all([
    fetchBenotpProducts(markups.accounts),
    fetchAccszoneProducts(markups.accounts),
  ]);

  const products = [...benotpResult.products, ...accszoneResult.products];

  // Only fail the whole request if EVERY source failed - if just one
  // provider is down, still return the other's listings rather than
  // showing an empty catalog to the customer.
  if (products.length === 0 && (benotpResult.error || accszoneResult.error)) {
    return NextResponse.json(
      {
        success: false,
        error: [benotpResult.error, accszoneResult.error].filter(Boolean).join('; '),
        products: [],
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    products,
    count: products.length,
    // Surfaced for debugging - a source can be silently empty (e.g. an
    // expired API key) without failing the whole request, so it's useful
    // to see whether either source hit an error even on a 200 response.
    sourceErrors: {
      benotp: benotpResult.error,
      accszone: accszoneResult.error,
    },
  });
}
