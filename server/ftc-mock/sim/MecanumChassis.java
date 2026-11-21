package sim;

/**
 * Server-authoritative mecanum physics. Integrates robot pose from the four motors' SIGNED
 * powers, so setDirection matters: forget to reverse the right side and the robot spins in
 * place instead of driving straight — exactly like real hardware.
 *
 * Field convention streamed to the browser: inches, origin bottom-left, +x right, +y up,
 * heading in radians with 0 = facing up the field, increasing CLOCKWISE.
 */
public class MecanumChassis {
    static final double MAX_LIN_IPS = 60.0;   // inches/sec at full power (~5 ft/s)
    static final double MAX_ANG_RPS = 2.6;    // rad/sec at full power (~150 deg/s)
    static final double FIELD_IN = 144.0;     // 12 ft field
    static final double HALF_ROBOT_IN = 9.0;  // 18" robot

    volatile double x = 72.0;       // inches, bottom-left origin (center of field)
    volatile double y = 72.0;
    volatile double heading = 0.0;  // radians, 0 = up the field, clockwise positive

    void step(double signedFL, double signedFR, double signedBL, double signedBR, double dt) {
        // Right-side wheels are physically mirrored (mounting factor -1); a wheel's
        // robot-forward velocity is mountingFactor * signedPower.
        double vfl =  signedFL;
        double vfr = -signedFR;
        double vbl =  signedBL;
        double vbr = -signedBR;

        double vForward = (vfl + vfr + vbl + vbr) / 4.0;
        double vStrafe  = (vfl - vfr - vbl + vbr) / 4.0;  // +1 = strafe right
        double omega    = (vfl - vfr + vbl - vbr) / 4.0;  // +1 = clockwise

        heading += omega * MAX_ANG_RPS * dt;
        double fwdX = Math.sin(heading),  fwdY = Math.cos(heading);    // forward direction
        double rightX = Math.cos(heading), rightY = -Math.sin(heading); // strafe-right direction
        x += (vForward * fwdX + vStrafe * rightX) * MAX_LIN_IPS * dt;
        y += (vForward * fwdY + vStrafe * rightY) * MAX_LIN_IPS * dt;

        double lo = HALF_ROBOT_IN, hi = FIELD_IN - HALF_ROBOT_IN;
        if (x < lo) x = lo; else if (x > hi) x = hi;
        if (y < lo) y = lo; else if (y > hi) y = hi;
    }
}
