import { EventEmitter } from "node:events";
import { describe, expect, it, vi } from "vitest";

import { registerShutdown } from "./shutdown";

function fakeProcess() {
  const emitter = new EventEmitter();
  const exit = vi.fn();
  return { emitter, exit, proc: { on: emitter.on.bind(emitter), exit } as never };
}

describe("registerShutdown", () => {
  it("runs tasks in order on SIGTERM and exits 0", async () => {
    const { emitter, exit, proc } = fakeProcess();
    const order: string[] = [];
    registerShutdown([() => void order.push("a"), async () => void order.push("b")], { proc });

    emitter.emit("SIGTERM");
    await vi.waitFor(() => expect(exit).toHaveBeenCalledWith(0));
    expect(order).toEqual(["a", "b"]);
  });

  it("runs tasks only once when signalled repeatedly", async () => {
    const { emitter, exit, proc } = fakeProcess();
    const task = vi.fn();
    registerShutdown([task], { proc });

    emitter.emit("SIGINT");
    emitter.emit("SIGTERM");
    await vi.waitFor(() => expect(exit).toHaveBeenCalled());
    expect(task).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledTimes(1);
  });

  it("keeps going after a failing task and exits 1", async () => {
    const { exit, proc } = fakeProcess();
    const second = vi.fn();
    const shutdown = registerShutdown(
      [
        () => {
          throw new Error("boom");
        },
        second,
      ],
      { proc },
    );

    await shutdown("test");
    expect(second).toHaveBeenCalled();
    expect(exit).toHaveBeenCalledWith(1);
  });
});
