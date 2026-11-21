import { compileAndRun, type StateSample } from "./ftcSandbox.ts";

// In the real app these imports are pre-filled in the lesson's starter code so beginners
// aren't blocked by boilerplate; here we include them to exercise the true compile path.
const IMPORTS = [
  "import com.qualcomm.robotcore.eventloop.opmode.LinearOpMode;",
  "import com.qualcomm.robotcore.eventloop.opmode.TeleOp;",
  "import com.qualcomm.robotcore.hardware.DcMotor;",
  "import com.qualcomm.robotcore.hardware.DcMotorSimple;",
].join("\n");

const GOOD = `${IMPORTS}

@TeleOp(name = "Mecanum Drive")
public class MecanumDrive extends LinearOpMode {
    @Override
    public void runOpMode() {
        DcMotor fl = hardwareMap.get(DcMotor.class, "frontLeft");
        DcMotor fr = hardwareMap.get(DcMotor.class, "frontRight");
        DcMotor bl = hardwareMap.get(DcMotor.class, "backLeft");
        DcMotor br = hardwareMap.get(DcMotor.class, "backRight");

        fr.setDirection(DcMotorSimple.Direction.REVERSE);
        br.setDirection(DcMotorSimple.Direction.REVERSE);

        waitForStart();
        while (opModeIsActive()) {
            double axial   = -gamepad1.left_stick_y;
            double lateral =  gamepad1.left_stick_x;
            double yaw     =  gamepad1.right_stick_x;

            double denom = Math.max(Math.abs(axial) + Math.abs(lateral) + Math.abs(yaw), 1.0);
            fl.setPower((axial + lateral + yaw) / denom);
            fr.setPower((axial - lateral - yaw) / denom);
            bl.setPower((axial - lateral + yaw) / denom);
            br.setPower((axial + lateral - yaw) / denom);

            telemetry.addData("axial", axial);
            telemetry.update();
        }
    }
}`;

const BROKEN = `${IMPORTS}

@TeleOp(name = "Broken Drive")
public class BrokenDrive extends LinearOpMode {
    @Override
    public void runOpMode() {
        DcMotor fl = hardwareMap.get(DcMotor.class, "frontLeft");
        waitForStart();
        while (opModeIsActive()) {
            fl.setPow(1.0)
        }
    }
}`;

const RUNTIME = `${IMPORTS}

@TeleOp(name = "Wrong Name")
public class WrongName extends LinearOpMode {
    @Override
    public void runOpMode() {
        DcMotor fl = hardwareMap.get(DcMotor.class, "front_left");
        waitForStart();
        while (opModeIsActive()) {
            fl.setPower(1.0);
        }
    }
}`;

function near(samples: StateSample[], t: number): StateSample {
  return samples.reduce((best, s) => (Math.abs(s.t - t) < Math.abs(best.t - t) ? s : best), samples[0]);
}
function approx(a: number, b: number): boolean { return Math.abs(a - b) < 0.05; }
function powers(s: StateSample): string {
  return `fl=${s.fl.toFixed(2)} fr=${s.fr.toFixed(2)} bl=${s.bl.toFixed(2)} br=${s.br.toFixed(2)}`;
}
function pose(s: StateSample): string {
  return `x=${s.x.toFixed(1)} y=${s.y.toFixed(1)} h=${(s.h * 180 / Math.PI).toFixed(1)}°`;
}

console.log("\n=== Case 1: valid Mecanum OpMode → powers AND server-side pose ===");
const r1 = await compileAndRun(GOOD, { runMillis: 800 });
if (r1.ok && r1.samples && r1.samples.length) {
  const strafe = near(r1.samples, 0.25);
  const turn = near(r1.samples, 0.70);
  console.log(`compiled: yes    state samples: ${r1.samples.length}`);
  console.log(`  strafe @${strafe.t.toFixed(2)}s  ${powers(strafe)}  →  ${pose(strafe)}`);
  console.log(`  turn   @${turn.t.toFixed(2)}s  ${powers(turn)}  →  ${pose(turn)}`);

  const strafePowers = approx(strafe.fl, 1) && approx(strafe.fr, -1) && approx(strafe.bl, -1) && approx(strafe.br, 1);
  const strafeMoved = strafe.x > 73 && approx(strafe.h, 0);                 // pure sideways
  const turnPowers = approx(turn.fl, 1) && approx(turn.fr, -1) && approx(turn.bl, 1) && approx(turn.br, -1);
  const turnRotated = Math.abs(turn.h) > 0.1;                              // rotated in place
  console.log(`  strafe: powers (1,-1,-1,1) & moved +x, no spin: ${strafePowers && strafeMoved ? "PASS ✓" : "FAIL ✗"}`);
  console.log(`  turn:   powers (1,-1,1,-1) & heading changed:   ${turnPowers && turnRotated ? "PASS ✓" : "FAIL ✗"}`);
} else {
  console.log("UNEXPECTED:", JSON.stringify(r1, null, 2));
}

console.log("\n=== Case 2: compile error (typo + missing semicolon) ===");
const r2 = await compileAndRun(BROKEN, { runMillis: 400 });
console.log(`compiled: ${r2.ok ? "yes (unexpected!)" : "no — diagnostics:"}`);
for (const d of r2.diagnostics ?? []) console.log(`  ${d.file}:${d.line}: ${d.kind}: ${d.message}`);

console.log("\n=== Case 3: runtime error (device name not in robot config) ===");
const r3 = await compileAndRun(RUNTIME, { runMillis: 400 });
console.log(`compiled: yes    runtimeError: ${r3.runtimeError ?? "(none — unexpected!)"}`);

console.log("");
