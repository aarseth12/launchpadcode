package com.qualcomm.robotcore.hardware;

/**
 * A simple touch (button) sensor — pressed or not pressed. Mirrors the real FTC
 * {@code com.qualcomm.robotcore.hardware.TouchSensor} so student code ports unchanged.
 */
public interface TouchSensor {
    /** 1.0 while pressed, 0.0 otherwise. (Real analog touch sensors report a range; ours is on/off.) */
    double getValue();

    /** True while the sensor is being pressed. */
    boolean isPressed();
}
