import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongo";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = await getDatabase();
    
    // Graceful degradation: jika MongoDB tidak tersedia, skip tanpa error
    if (!db) {
      console.warn("Audit log skipped: MONGODB_URI not set");
      return NextResponse.json(
        { ok: false, message: "audit log skipped (MongoDB not configured)" },
        { status: 200 },
      );
    }

    await db.collection("audit_logs").insertOne({
      ...body,
      createdAt: new Date(),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    // Graceful degradation: jika MongoDB tidak tersedia atau error, skip tanpa error
    console.warn("Audit log skipped (MongoDB error):", error);
    return NextResponse.json(
      { ok: false, message: "audit log skipped" },
      { status: 200 },
    );
  }
}


