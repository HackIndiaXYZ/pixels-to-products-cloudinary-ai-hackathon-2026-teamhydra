import { describe, expect, it } from "vitest";
import { createPipelineState, withStage } from "@/lib/pipeline";
import { PIPELINE_STAGE_IDS } from "@/types/pipeline";

describe("pipeline state", () => {
  it("starts with every stage pending", () => {
    const state = createPipelineState();
    expect(Object.keys(state)).toEqual([...PIPELINE_STAGE_IDS]);
    expect(Object.values(state).every((s) => s === "pending")).toBe(true);
  });

  it("updates one stage without mutating the original", () => {
    const before = createPipelineState();
    const after = withStage(before, "TAG", "skipped");
    expect(after.TAG).toBe("skipped");
    expect(before.TAG).toBe("pending");
    expect(after.INGEST).toBe("pending");
  });
});