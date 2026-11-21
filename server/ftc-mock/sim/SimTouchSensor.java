package sim;

import com.qualcomm.robotcore.hardware.TouchSensor;

/**
 * Simulated touch sensor: "pressed" when the robot's front bumper is against a field wall.
 *
 * The physics clamps the robot's center to HALF_ROBOT_IN from each wall, so sitting at that
 * limit means the bumper is touching. We read the chassis pose (written by the physics thread,
 * fields are volatile) and report pressed when the robot is at any wall.
 */
public class SimTouchSensor implements TouchSensor {
    private final MecanumChassis chassis;
    private static final double MARGIN_IN = 0.5; // tolerance so "at the wall" reliably reads as pressed

    public SimTouchSensor(MecanumChassis chassis) {
        this.chassis = chassis;
    }

    public boolean isPressed() { BusClock.charge(); return atWall(); }

    public double getValue() { BusClock.charge(); return atWall() ? 1.0 : 0.0; }

    private boolean atWall() {
        double lo = MecanumChassis.HALF_ROBOT_IN + MARGIN_IN;
        double hi = MecanumChassis.FIELD_IN - MecanumChassis.HALF_ROBOT_IN - MARGIN_IN;
        return chassis.x <= lo || chassis.x >= hi || chassis.y <= lo || chassis.y >= hi;
    }
}
