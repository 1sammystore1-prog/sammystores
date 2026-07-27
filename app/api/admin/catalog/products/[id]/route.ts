import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/adminAuth';
import CatalogProduct from '@/models/CatalogProduct';
import CatalogItem from '@/models/CatalogItem';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const admin = await verifyAdmin(request);
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const updates: Record<string, any> = {};
  if (body.name !== undefined) updates.name = String(body.name).trim();
  if (body.category !== undefined) updates.category = String(body.category).trim();
  if (body.description !== undefined) updates.description = body.description;
  if (body.instructions !== undefined) updates.instructions = body.instructions;
  if (body.active !== undefined) updates.active = Boolean(body.active);
  if (body.price !== undefined) {
    const numericPrice = parseFloat(String(body.price));
    if (isNaN(numericPrice) || numericPrice <= 0) {
      return NextResponse.json({ success: false, error: 'Price must be a positive number' }, { status: 400 });
    }
    updates.price = numericPrice;
  }
  if (body.imageUrl !== undefined) {
    if (!body.imageUrl) {
      updates.imageUrl = '';
    } else {
      const isImageDataUri = /^data:image\/(png|jpe?g|webp|gif);base64,/.test(body.imageUrl);
      const approxBytes = (body.imageUrl.length * 3) / 4;
      if (!isImageDataUri) {
        return NextResponse.json({ success: false, error: 'Product image must be an image' }, { status: 400 });
      }
      if (approxBytes > 5 * 1024 * 1024) {
        return NextResponse.json({ success: false, error: 'Product image must be under 5MB' }, { status: 400 });
      }
      updates.imageUrl = body.imageUrl;
    }
  }

  const product = await CatalogProduct.findByIdAndUpdate(id, { $set: updates }, { returnDocument: 'after' });
  if (!product) return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });

  return NextResponse.json({ success: true, product });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const admin = await verifyAdmin(request);
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const soldCount = await CatalogItem.countDocuments({ productId: id, status: 'sold' });
  if (soldCount > 0) {
    return NextResponse.json(
      { success: false, error: `Cannot delete: ${soldCount} unit(s) already sold from this product. Deactivate it instead.` },
      { status: 400 }
    );
  }

  await CatalogItem.deleteMany({ productId: id, status: 'available' });
  const product = await CatalogProduct.findByIdAndDelete(id);
  if (!product) return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });

  return NextResponse.json({ success: true, message: 'Product deleted' });
}
