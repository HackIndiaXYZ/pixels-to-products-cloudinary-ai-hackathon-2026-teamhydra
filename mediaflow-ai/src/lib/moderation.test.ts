import { describe, expect, it } from "vitest";
import { overallModeration } from "@/lib/moderation";

describe("overallModeration", () => {
  it("returns null when there is no moderation data", () => {
    expect(overallModeration(undefined)).toBeNull();
    expect(overallModeration([])).toBeNull();
  });

  it("rejects if any entry is rejected", () => {
    expect(overallModeration([{ status: "approved" }, { status: "rejected" }])).toBe("rejected");
  });

  it("approves only when every entry is approved", () => {
    expect(overallModeration([{ status: "approved" }, { status: "approved" }])).toBe("approved");
  });

  it("treats mixed or unknown statuses as pending", () => {
    expect(overallModeration([{ status: "approved" }, { status: "pending" }])).toBe("pending");
    expect(overallModeration([{ status: "something-new" }])).toBe("pending");
  });
});