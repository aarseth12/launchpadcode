package org.firstinspires.ftc.robotcore.external.navigation;

/**
 * Units of distance, mirroring the real FTC SDK enum so student code ports unchanged.
 * The simulator measures in inches internally and converts to whatever unit the student
 * asks for in {@code distanceSensor.getDistance(unit)}.
 */
public enum DistanceUnit {
    METER(1.0), CM(100.0), MM(1000.0), INCH(1.0 / 0.0254);

    /** How many of this unit make up one meter (e.g. CM = 100, MM = 1000). */
    public final double perMeter;

    DistanceUnit(double perMeter) {
        this.perMeter = perMeter;
    }

    private static final double METERS_PER_INCH = 0.0254;

    /** Convert a value given in inches into this unit. */
    public double fromInches(double inches) {
        return inches * METERS_PER_INCH * perMeter;
    }

    /** Convert a value given in this unit back into inches. */
    public double toInches(double value) {
        return value / perMeter / METERS_PER_INCH;
    }
}
