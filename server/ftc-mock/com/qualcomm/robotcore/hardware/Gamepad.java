package com.qualcomm.robotcore.hardware;

public class Gamepad {
    // volatile: written by the input thread, read by the OpMode thread
    public volatile float left_stick_x = 0f;
    public volatile float left_stick_y = 0f;
    public volatile float right_stick_x = 0f;
    public volatile float right_stick_y = 0f;

    public boolean a, b, x, y;
    public boolean dpad_up, dpad_down, dpad_left, dpad_right;
    public boolean left_bumper, right_bumper;
    public float left_trigger = 0f;
    public float right_trigger = 0f;
}
