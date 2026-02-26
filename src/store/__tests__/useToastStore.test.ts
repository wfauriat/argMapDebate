import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { useToastStore } from "@/store/useToastStore";

describe("useToastStore", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Clear any leftover toasts
    useToastStore.setState({ toasts: [] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("addToast adds a toast", () => {
    useToastStore.getState().addToast("error", "Something went wrong");
    const { toasts } = useToastStore.getState();
    expect(toasts).toHaveLength(1);
    expect(toasts[0].level).toBe("error");
    expect(toasts[0].message).toBe("Something went wrong");
  });

  it("multiple toasts stack", () => {
    const { addToast } = useToastStore.getState();
    addToast("error", "Error 1");
    addToast("warning", "Warning 1");
    addToast("success", "Done");
    expect(useToastStore.getState().toasts).toHaveLength(3);
  });

  it("removeToast removes a specific toast", () => {
    useToastStore.getState().addToast("info", "First");
    useToastStore.getState().addToast("info", "Second");
    const id = useToastStore.getState().toasts[0].id;
    useToastStore.getState().removeToast(id);
    const { toasts } = useToastStore.getState();
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe("Second");
  });

  it("error toasts auto-dismiss after 8s", () => {
    useToastStore.getState().addToast("error", "Oops");
    expect(useToastStore.getState().toasts).toHaveLength(1);
    vi.advanceTimersByTime(7999);
    expect(useToastStore.getState().toasts).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it("success toasts auto-dismiss after 3s", () => {
    useToastStore.getState().addToast("success", "Done");
    vi.advanceTimersByTime(3000);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it("warning toasts auto-dismiss after 5s", () => {
    useToastStore.getState().addToast("warning", "Heads up");
    vi.advanceTimersByTime(4999);
    expect(useToastStore.getState().toasts).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it("each toast gets a unique id", () => {
    const { addToast } = useToastStore.getState();
    addToast("info", "A");
    addToast("info", "B");
    const ids = useToastStore.getState().toasts.map((t) => t.id);
    expect(new Set(ids).size).toBe(2);
  });
});
