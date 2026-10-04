import type { PipelineStageId, PipelineState, StageStatus } from "@/types/pipeline";

export function createPipelineState(): PipelineState {
  return {
    INGEST: "pending",
    ANALYZE: "pending",
    TAG: "pending",
    MODERATE: "pending",
    ORGANIZE: "pending",
    TRANSFORM: "pending",
    OPTIMIZE: "pending",
    DELIVER: "pending",
  };
}

export function withStage(state: PipelineState, id: PipelineStageId, status: StageStatus): PipelineState {
  return { ...state, [id]: status };
}