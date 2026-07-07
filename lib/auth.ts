import jwt from 'jsonwebtoken';

export function getUserId(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return decoded.id;
  } catch (e) { 
    return null; 
  }
}
