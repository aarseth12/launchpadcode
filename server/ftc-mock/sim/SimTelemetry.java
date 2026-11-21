package sim;

import org.firstinspires.ftc.robotcore.external.Telemetry;
import java.util.LinkedHashMap;
import java.util.Map;

/** Collects telemetry; update() snapshots the latest state, which the Runner samples at a fixed rate. */
public class SimTelemetry implements Telemetry {
    private final Map<String, String> data = new LinkedHashMap<>();
    private static final Item ITEM = new Item() {};
    private volatile String latestDataJson = "{}";

    public Item addData(String caption, Object value) {
        data.put(caption, String.valueOf(value));
        return ITEM;
    }
    public Item addData(String caption, String format, Object... args) {
        data.put(caption, String.format(java.util.Locale.US, format, args));
        return ITEM;
    }
    public void addLine(String lineCaption) {
        data.put("line" + data.size(), lineCaption);
    }
    public void clear() { data.clear(); }

    public boolean update() {
        // Do NOT print here: a tight while(opModeIsActive()) loop calls update() thousands of
        // times/sec and would flood stdout. Snapshot the latest state instead; the Runner samples
        // it at a fixed rate, like the Driver Station refreshing its display.
        StringBuilder sb = new StringBuilder("{");
        boolean first = true;
        for (Map.Entry<String, String> e : data.entrySet()) {
            if (!first) sb.append(",");
            first = false;
            sb.append(jsonString(e.getKey())).append(":").append(jsonString(e.getValue()));
        }
        sb.append("}");
        latestDataJson = sb.toString();
        return true;
    }

    /** Latest telemetry as a JSON object string, sampled by the Runner each tick. */
    public String latestDataJson() { return latestDataJson; }

    /** Minimal JSON string escaper, shared with Runner. */
    static String jsonString(String s) {
        StringBuilder b = new StringBuilder("\"");
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            switch (c) {
                case '"':  b.append("\\\""); break;
                case '\\': b.append("\\\\"); break;
                case '\n': b.append("\\n"); break;
                case '\r': b.append("\\r"); break;
                case '\t': b.append("\\t"); break;
                default:   b.append(c);
            }
        }
        return b.append("\"").toString();
    }
}
