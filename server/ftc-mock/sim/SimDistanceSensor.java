package sim;

import com.qualcomm.robotcore.hardware.DistanceSensor;
import org.firstinspires.ftc.robotcore.external.navigation.DistanceUnit;

/**
 * Simulated forward-facing distance sensor (think a Rev 2m sensor on the front bumper).
 * Casts a ray from the robot's center along its heading to the field wall ahead, then reports
 * the gap between the front bumper and that wall. Reads the chassis pose (volatile fields),
 * matching the same forward direction the physics uses: forward = (sin h, cos h).
 */
public class SimDistanceSensor implements DistanceSensor {
    private final MecanumChassis chassis;

    public SimDistanceSensor(MecanumChassis chassis) {
        this.chassis = chassis;
    }

    /** Distance from the front bumper to the wall straight ahead, in inches (never negative). */
    public double distanceInches() {
        double dx = Math.sin(chassis.heading); // forward direction, same as MecanumChassis.step
        double dy = Math.cos(chassis.heading);
        double t = Double.MAX_VALUE;            // ray length from center to the wall ahead
        if (dx >  1e-9) t = Math.min(t, (MecanumChassis.FIELD_IN - chassis.x) / dx); // toward +x wall
        if (dx < -1e-9) t = Math.min(t, (0.0 - chassis.x) / dx);                     // toward -x wall
        if (dy >  1e-9) t = Math.min(t, (MecanumChassis.FIELD_IN - chassis.y) / dy); // toward +y wall
        if (dy < -1e-9) t = Math.min(t, (0.0 - chassis.y) / dy);                     // toward -y wall
        return Math.max(0.0, t - MecanumChassis.HALF_ROBOT_IN); // subtract bumper offset
    }

    public double getDistance(DistanceUnit unit) {
        BusClock.charge();
        return unit.fromInches(distanceInches());
    }
}
