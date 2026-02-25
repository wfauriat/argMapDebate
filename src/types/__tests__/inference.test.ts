import { describe, it, expect } from "vitest";
import { CredencePreset, CREDENCE_PRESET_VALUES } from "@/types/inference";

describe("CREDENCE_PRESET_VALUES", () => {
  it("all presets are in [0, 1] range", () => {
    for (const preset of Object.values(CredencePreset)) {
      const value = CREDENCE_PRESET_VALUES[preset];
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });

  it("presets are in ascending order", () => {
    const ordered = [
      CredencePreset.VeryLow,
      CredencePreset.Low,
      CredencePreset.Medium,
      CredencePreset.High,
      CredencePreset.VeryHigh,
    ];
    for (let i = 1; i < ordered.length; i++) {
      expect(CREDENCE_PRESET_VALUES[ordered[i]]).toBeGreaterThan(
        CREDENCE_PRESET_VALUES[ordered[i - 1]],
      );
    }
  });

  it("has correct specific values", () => {
    expect(CREDENCE_PRESET_VALUES[CredencePreset.VeryLow]).toBe(0.1);
    expect(CREDENCE_PRESET_VALUES[CredencePreset.Low]).toBe(0.3);
    expect(CREDENCE_PRESET_VALUES[CredencePreset.Medium]).toBe(0.5);
    expect(CREDENCE_PRESET_VALUES[CredencePreset.High]).toBe(0.7);
    expect(CREDENCE_PRESET_VALUES[CredencePreset.VeryHigh]).toBe(0.9);
  });
});
