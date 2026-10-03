export type ApiErrorCode =
  | "INVALID_INPUT"
  | "ENV_MISSING"
  | "CLOUDINARY_ERROR"
  | "UPLOAD_FAILED"
  | "UNSUPPORTED_MEDIA"
  | "TRANSFORM_FAILED"
  | "NETWORK_ERROR"
  | "INTERNAL_ERROR";

export type ApiSuccess<T> = { success: true; data: T };
export type ApiFailure = { success: false; error: { code: ApiErrorCode; message: string } };
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;