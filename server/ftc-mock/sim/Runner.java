package sim;

import com.qualcomm.robotcore.eventloop.opmode.LinearOpMode;
import com.qualcomm.robotcore.hardware.HardwareMap;
import com.qualcomm.robotcore.hardware.Gamepad;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.Locale;

/**
 * Sim worker. Instantiates the student's OpMode, injects mock hardware, runs runOpMode() on
 * its own thread (like the real Robot Controller), integrates server-authoritative mecanum
 * physics, and streams robot state as JSON lines on stdout.
 *
 * Modes:
 *   stream (default)  — gamepad arrives on stdin as "g1 lx ly rx ry"; runs until "stop" or maxMs
 *   scripted          — headless self-test: scripted strafe-then-turn over a fixed window
 *
 * In production the stream worker runs inside a Docker sandbox; Node bridges its stdio to the
 * browser WebSocket.
 */
public class Runner {
    static volatile boolean running = true;

    public static void main(String[] args) throws Exception {
        String className = args.length > 0 ? args[0] : "MecanumDrive";
        String mode = args.length > 1 ? args[1] : "stream";
        boolean scripted = mode.equals("scripted");
        long durMs = args.length > 2 ? Long.parseLong(args[2]) : (scripted ? 800L : 600_000L);

        HardwareMap hardwareMap = new HardwareMap();
        SimDcMotor fl = new SimDcMotor(), fr = new SimDcMotor(), bl = new SimDcMotor(), br = new SimDcMotor();
        SimServo claw = new SimServo();
        hardwareMap.__register("frontLeft", fl);
        hardwareMap.__register("frontRight", fr);
        hardwareMap.__register("backLeft", bl);
        hardwareMap.__register("backRight", br);
        hardwareMap.__register("claw", claw);

        Gamepad gamepad1 = new Gamepad();
        Gamepad gamepad2 = new Gamepad();
        SimTelemetry telemetry = new SimTelemetry();
        MecanumChassis chassis = new MecanumChassis();
        SimTouchSensor touch = new SimTouchSensor(chassis); // "pressed" when the bumper reaches a wall
        hardwareMap.__register("touch", touch);
        SimDistanceSensor distance = new SimDistanceSensor(chassis); // forward-facing range to the wall ahead
        hardwareMap.__register("distance", distance);

        LinearOpMode op;
        try {
            Object instance = Class.forName(className).getDeclaredConstructor().newInstance();
            if (!(instance instanceof LinearOpMode)) {
                emit("{\"type\":\"error\",\"message\":" + SimTelemetry.jsonString(className + " must extend LinearOpMode") + "}");
                return;
            }
            op = (LinearOpMode) instance;
        } catch (Throwable t) {
            emit("{\"type\":\"error\",\"message\":" + SimTelemetry.jsonString("Could not load OpMode: " + t) + "}");
            return;
        }
        op.hardwareMap = hardwareMap;
        op.gamepad1 = gamepad1;
        op.gamepad2 = gamepad2;
        op.telemetry = telemetry;

        final Throwable[] thrown = new Throwable[1];
        Thread opThread = new Thread(() -> {
            try { op.runOpMode(); }
            catch (Throwable t) { thrown[0] = t; }
        }, "opmode");
        opThread.setDaemon(true);

        if (!scripted) {
            Thread stdin = new Thread(() -> readGamepad(gamepad1), "stdin");
            stdin.setDaemon(true);
            stdin.start();
        }

        emit("{\"type\":\"started\"}");
        opThread.start();
        op.__simStart();

        long startNano = System.nanoTime();
        long lastNano = startNano;
        long endNano = startNano + durMs * 1_000_000L;

        while (running && thrown[0] == null && System.nanoTime() < endNano) {
            long now = System.nanoTime();
            double dt = (now - lastNano) / 1e9;
            if (dt > 0.05) dt = 0.05;
            lastNano = now;
            double elapsed = (now - startNano) / 1e9;

            if (scripted) {
                double frac = (now - startNano) / (double) (durMs * 1_000_000L);
                gamepad1.left_stick_x = 0f; gamepad1.left_stick_y = 0f; gamepad1.right_stick_x = 0f;
                if (frac < 0.6) gamepad1.left_stick_x = 1.0f; else gamepad1.right_stick_x = 1.0f;
            }

            chassis.step(fl.getSignedPower(), fr.getSignedPower(), bl.getSignedPower(), br.getSignedPower(), dt);
            emitState(elapsed, chassis, fl, fr, bl, br, claw, touch, distance, telemetry);
            Thread.sleep(20); // ~50 Hz
        }

        running = false;
        op.__simRequestStop();
        opThread.join(1500);

        if (thrown[0] != null) {
            emit("{\"type\":\"runtimeError\",\"message\":" + SimTelemetry.jsonString(String.valueOf(thrown[0])) + "}");
            emit("{\"type\":\"done\"}");
            Runtime.getRuntime().halt(1);
        }
        if (opThread.isAlive()) {
            emit("{\"type\":\"timeout\",\"message\":" + SimTelemetry.jsonString(
                "OpMode never returned (did you check opModeIsActive()?) — killed") + "}");
            Runtime.getRuntime().halt(124);
        }
        emit("{\"type\":\"done\"}");
        Runtime.getRuntime().halt(0);
    }

    static void readGamepad(Gamepad g1) {
        try (BufferedReader in = new BufferedReader(new InputStreamReader(System.in))) {
            String line;
            while (running && (line = in.readLine()) != null) {
                line = line.trim();
                if (line.equals("stop")) { running = false; return; }
                if (line.startsWith("g1 ")) {
                    String[] p = line.split("\\s+");
                    if (p.length >= 5) {
                        try {
                            g1.left_stick_x  = Float.parseFloat(p[1]);
                            g1.left_stick_y  = Float.parseFloat(p[2]);
                            g1.right_stick_x = Float.parseFloat(p[3]);
                            g1.right_stick_y = Float.parseFloat(p[4]);
                        } catch (NumberFormatException ignored) { }
                    }
                }
            }
        } catch (Exception ignored) { }
    }

    static void emit(String line) { System.out.println(line); System.out.flush(); }

    static void emitState(double t, MecanumChassis c, SimDcMotor fl, SimDcMotor fr, SimDcMotor bl, SimDcMotor br, SimServo claw, SimTouchSensor touch, SimDistanceSensor distance, SimTelemetry tel) {
        emit(String.format(Locale.US,
            "{\"type\":\"state\",\"t\":%.2f,\"x\":%.2f,\"y\":%.2f,\"h\":%.4f,\"fl\":%.3f,\"fr\":%.3f,\"bl\":%.3f,\"br\":%.3f,\"claw\":%.3f,\"touch\":%b,\"dist\":%.2f,\"telemetry\":%s}",
            t, c.x, c.y, c.heading, fl.getPower(), fr.getPower(), bl.getPower(), br.getPower(), claw.getPosition(), touch.isPressed(), distance.distanceInches(), tel.latestDataJson()));
    }
}
