package com.qualcomm.robotcore.hardware;

import java.util.HashMap;
import java.util.Map;

public class HardwareMap {
    public final Map<String, Object> __devices = new HashMap<>();

    @SuppressWarnings("unchecked")
    public <T> T get(Class<? extends T> classOrInterface, String deviceName) {
        Object device = __devices.get(deviceName);
        if (device == null) {
            throw new IllegalArgumentException(
                "Unable to find a hardware device with the name \"" + deviceName + "\"");
        }
        return (T) device;
    }

    /** Sim-only: register a simulated device under a config name. */
    public void __register(String name, Object device) { __devices.put(name, device); }
}
