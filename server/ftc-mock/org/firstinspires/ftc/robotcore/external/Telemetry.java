package org.firstinspires.ftc.robotcore.external;

public interface Telemetry {
    /** Real SDK returns a Telemetry.Item; beginners ignore it, but we keep it for signature parity. */
    interface Item { }

    Item addData(String caption, Object value);
    Item addData(String caption, String format, Object... args);
    void addLine(String lineCaption);
    boolean update();
    void clear();
}
