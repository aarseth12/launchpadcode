package com.qualcomm.robotcore.hardware;

import org.firstinspires.ftc.robotcore.external.navigation.DistanceUnit;

/**
 * Reports the distance to whatever the sensor is pointed at. Mirrors the real FTC
 * {@code com.qualcomm.robotcore.hardware.DistanceSensor} so student code ports unchanged.
 */
public interface DistanceSensor {
    /** Distance to the target ahead, in the requested unit (e.g. {@code DistanceUnit.CM}). */
    double getDistance(DistanceUnit unit);
}
