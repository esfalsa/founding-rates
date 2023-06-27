import { NextResponse } from "next/server";
import { getAllFoundings, getTargetTime } from "@/utils/api";

export async function GET() {
  const targetTime = getTargetTime();
  return NextResponse.json(await getAllFoundings(targetTime));
}
