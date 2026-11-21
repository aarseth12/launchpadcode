package sim;

import java.util.concurrent.locks.LockSupport;

/**
 * Models the Control Hub's I/O pacing so an OpMode loop in the sim runs at a realistic rate
 * instead of spinning at raw CPU speed. (Without this, loop-timed code — e.g. a servo that
 * steps a little each pass — runs thousands of times faster than on a real robot.)
 *
 * Two effects, both matching real hardware:
 *   1. A floor period of ~9 ms (~110 Hz): even a loop that touches almost no hardware can't
 *      iterate faster than the LynxModule bus + firmware allow.
 *   2. A small extra cost per device transaction (setPower / getCurrentPosition / sensor read…),
 *      so a loop that talks to more hardware runs a little slower — like a real robot, and the
 *      reason bulk reads exist.
 *
 * charge() only counts calls made on the OpMode thread, so the physics thread's 50 Hz telemetry
 * reads (getPower / getPosition / isPressed) don't inflate the clock. tick() is called once per
 * loop iteration from LinearOpMode.opModeIsActive().
 */
public final class BusClock {
    private BusClock() {}

    static final long BASE_PERIOD_NS = 9_000_000L;   // ~111 Hz floor: bus + firmware overhead per loop
    static final long CALL_COST_NS   =   400_000L;   // ~0.4 ms added per device read/write
    static final long MAX_EXTRA_NS   = 40_000_000L;  // clamp pathological loops (thousands of calls) to +40 ms

    private static long pendingNs = 0;   // device time charged by THIS iteration (OpMode thread only)
    private static long lastTickNs = 0;  // when the previous iteration was released

    /** A mock device call adds a little bus time — but only when the OpMode itself made the call. */
    public static void charge() {
        if (Thread.currentThread().getName().equals("opmode")) pendingNs += CALL_COST_NS;
    }

    /** Once per loop: sleep so the iteration lasts at least BASE_PERIOD plus this loop's device time. */
    public static void tick() {
        long now = System.nanoTime();
        if (lastTickNs == 0) lastTickNs = now;
        long period = BASE_PERIOD_NS + Math.min(pendingNs, MAX_EXTRA_NS);
        pendingNs = 0;
        long target = lastTickNs + period;
        long remaining = target - System.nanoTime();
        if (remaining > 0) LockSupport.parkNanos(remaining);
        lastTickNs = (remaining > 0) ? target : System.nanoTime();
    }
}
