import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || '';
const client = new MongoClient(uri);

export async function GET() {
  try {
    await client.connect();
    const db = client.db();
    const leads = await db.collection('leads').find({}).toArray();
    return NextResponse.json(leads);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  } finally {
    await client.close();
  }
}
