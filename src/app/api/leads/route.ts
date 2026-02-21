import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, Filter, Sort, Document } from 'mongodb';

const uri = process.env.MONGODB_URI || '';
const client = new MongoClient(uri);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '12');
  const query = searchParams.get('query') || '';
  const sortBy = searchParams.get('sortBy') || 'position';
  
  try {
    await client.connect();
    const db = client.db();
    const collection = db.collection('leads');

    // Build filter
    let filter: Record<string, any> = {};
    if (query) {
      filter = {
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { query: { $regex: query, $options: 'i' } },
          { snippet: { $regex: query, $options: 'i' } }
        ]
      };
    }

    // Build sort
    let sort: Sort = {};
    if (sortBy === 'position') {
      sort = { position: 1 };
    } else {
      sort = { title: 1 };
    }

    // Fetch data with pagination
    const skip = (page - 1) * pageSize;
    
    const [leads, total] = await Promise.all([
      collection.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(pageSize)
        .toArray(),
      collection.countDocuments(filter)
    ]);

    return NextResponse.json({
      leads,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  } finally {
    await client.close();
  }
}
