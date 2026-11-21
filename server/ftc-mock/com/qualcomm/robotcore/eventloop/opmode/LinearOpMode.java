package com.qualcomm.robotcore.eventloop.opmode;

import com.qualcomm.robotcore.hardware.HardwareMap;
import com.qualcomm.robotcore.hardware.Gamepad;
import org.firstinspires.ftc.robotcore.external.Telemetry;

/**
 * Minimal stand-in for the real FTC {@code LinearOpMode}. Same package and same public
 * surface students actually use, so an OpMode written against this drops into Android
 * Studio unchanged. The simulator controls the start/stop lifecycle via the __sim* hooks.
 */
public abstract class LinearOpMode {
    public HardwareMap hardwareMap;
    public Gamepad gamepad1;
    public Gamepad gamepad2;
    public Telemetry telemetry;

    private volatile boolean started = false;
    private volatile boolean stopRequested = false;

    public abstract void runOpMode() throws InterruptedException;

    public void waitForStart() {
        while (!started && !stopRequested) {
            try { Thread.sleep(1); }
            catch (InterruptedException e) { Thread.currentThread().interrupt(); return; }
        }
    }

    public boolean opModeIsActive() {
        boolean active = started && !stopRequested;
        // Real robots pace this loop with bus/firmware I/O; the sim does it explicitly so loop
        // timing matches a real Control Hub instead of spinning at CPU speed. (The real SDK
        // likewise calls idle() here.) Sim-only hook — not part of the real SDK surface.
        if (active) sim.BusClock.tick();
        return active;
    }
    public boolean opModeInInit() { return !started && !stopRequested; }
    public boolean isStarted() { return started; }
    public boolean isStopRequested() { return stopRequested; }
    public void idle() { Thread.yield(); }

    public void sleep(long milliseconds) {
        try { Thread.sleep(milliseconds); }
        catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }

    // --- Simulator control hooks (NOT part of the real SDK; used only by the sim Runner) ---
    public void __simStart() { started = true; }
    public void __simRequestStop() { stopRequested = true; }
}
