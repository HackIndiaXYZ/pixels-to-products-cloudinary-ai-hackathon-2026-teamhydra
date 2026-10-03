export const PIPELINE_STAGE_IDS = [
  "INGEST", "ANALYZE", "TAG", "MODERATE",
  "ORGANIZE", "TRANSFORM", "OPTIMIZE", "DELIVER",
] as const;

export type PipelineStageId = (typeof PIPELINE_STAGE_IDS)[number];
export type StageStatus = "pending" | "processing" | "completed" | "failed";
export type PipelineState = Record<PipelineStageId, StageStatus>;