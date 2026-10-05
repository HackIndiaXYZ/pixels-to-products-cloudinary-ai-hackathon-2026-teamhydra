import { NextResponse } from "next/server";
import type { ApiErrorCode, ApiFailure, ApiSuccess } from "@/types/api";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json<ApiSuccess<T>>({ success: true, data }, { status });
}

export function fail(code: ApiErrorCode, message: string, status: number) {
  return NextResponse.json<ApiFailure>({ success: false, error: { code, message } }, { status });
}