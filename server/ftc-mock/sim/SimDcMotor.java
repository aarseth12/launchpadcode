package sim;

import com.qualcomm.robotcore.hardware.DcMotor;

/** Simulated motor: records commanded power/direction; physics reads it back. */
public class SimDcMotor implements DcMotor {
    private volatile double power = 0.0; // written by the OpMode thread, read by the physics thread
    private Direction direction = Direction.FORWARD;
    private RunMode mode = RunMode.RUN_WITHOUT_ENCODER;
    private ZeroPowerBehavior zeroPowerBehavior = ZeroPowerBehavior.BRAKE;
    private int targetPosition = 0;

    public void setPower(double power) { BusClock.charge(); this.power = power; }
    public double getPower() { BusClock.charge(); return power; }

    public void setDirection(Direction direction) { this.direction = direction; }
    public Direction getDirection() { return direction; }

    public void setMode(RunMode mode) { this.mode = mode; }
    public RunMode getMode() { return mode; }

    public void setTargetPosition(int position) { BusClock.charge(); this.targetPosition = position; }
    public int getTargetPosition() { return targetPosition; }
    public boolean isBusy() { BusClock.charge(); return false; }
    public int getCurrentPosition() { BusClock.charge(); return 0; }

    public void setZeroPowerBehavior(ZeroPowerBehavior behavior) { this.zeroPowerBehavior = behavior; }
    public ZeroPowerBehavior getZeroPowerBehavior() { return zeroPowerBehavior; }

    /** Power after the configured direction is applied — what the physics model will consume. */
    public double getSignedPower() {
        return direction == Direction.REVERSE ? -power : power;
    }
}
