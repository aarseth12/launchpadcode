package sim;

import com.qualcomm.robotcore.hardware.Servo;

/** Simulated servo: clamps to [0, 1] like real hardware. */
public class SimServo implements Servo {
    private volatile double position = 0.0; // written by the OpMode thread, read by the physics thread
    private Direction direction = Direction.FORWARD;

    public void setPosition(double position) {
        BusClock.charge();
        this.position = Math.max(0.0, Math.min(1.0, position));
    }
    public double getPosition() { BusClock.charge(); return position; }

    public void setDirection(Direction direction) { this.direction = direction; }
    public Direction getDirection() { return direction; }
}
