import { LESSONS, lessonById } from "./lessons.ts";
import { gradeLesson, type GradeResult } from "./grader.ts";

const IMPORTS = `import com.qualcomm.robotcore.eventloop.opmode.LinearOpMode;
import com.qualcomm.robotcore.eventloop.opmode.TeleOp;
import com.qualcomm.robotcore.hardware.DcMotor;
import com.qualcomm.robotcore.hardware.DcMotorSimple;`;

const CORRECT: Record<string, string> = {
  telemetry: `${IMPORTS}

@TeleOp(name = "Hello Robot")
public class HelloRobot extends LinearOpMode {
    @Override
    public void runOpMode() {
        waitForStart();
        while (opModeIsActive()) {
            telemetry.addData("status", "Hello!");
            telemetry.update();
        }
    }
}`,
  motor: `${IMPORTS}

@TeleOp(name = "Spin a Motor")
public class SpinMotor extends LinearOpMode {
    @Override
    public void runOpMode() {
        DcMotor frontLeft = hardwareMap.get(DcMotor.class, "frontLeft");
        waitForStart();
        while (opModeIsActive()) {
            frontLeft.setPower(0.6);
        }
    }
}`,
  mecanum: `${IMPORTS}

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
            double denom   = Math.max(Math.abs(axial) + Math.abs(lateral) + Math.abs(yaw), 1.0);
            fl.setPower((axial + lateral + yaw) / denom);
            fr.setPower((axial - lateral - yaw) / denom);
            bl.setPower((axial - lateral + yaw) / denom);
            br.setPower((axial + lateral - yaw) / denom);
            telemetry.addData("status", "driving");
            telemetry.update();
        }
    }
}`,
};

// "mistake" = a realistic wrong answer. L1/L2 leave the starter incomplete; L3 forgets to reverse.
const WRONG: Record<string, string> = {
  telemetry: lessonById("telemetry")!.starterCode,
  motor: lessonById("motor")!.starterCode,
  mecanum: `${IMPORTS}

@TeleOp(name = "Mecanum Drive")
public class MecanumDrive extends LinearOpMode {
    @Override
    public void runOpMode() {
        DcMotor fl = hardwareMap.get(DcMotor.class, "frontLeft");
        DcMotor fr = hardwareMap.get(DcMotor.class, "frontRight");
        DcMotor bl = hardwareMap.get(DcMotor.class, "backLeft");
        DcMotor br = hardwareMap.get(DcMotor.class, "backRight");
        // (forgot to reverse the right-side motors!)
        waitForStart();
        while (opModeIsActive()) {
            double axial   = -gamepad1.left_stick_y;
            double lateral =  gamepad1.left_stick_x;
            double yaw     =  gamepad1.right_stick_x;
            double denom   = Math.max(Math.abs(axial) + Math.abs(lateral) + Math.abs(yaw), 1.0);
            fl.setPower((axial + lateral + yaw) / denom);
            fr.setPower((axial - lateral - yaw) / denom);
            bl.setPower((axial - lateral + yaw) / denom);
            br.setPower((axial + lateral - yaw) / denom);
            telemetry.addData("status", "driving");
            telemetry.update();
        }
    }
}`,
};

function summary(g: GradeResult): string {
  if (g.compileError) return "compile error";
  return g.results.map((r) => `${r.pass ? "✓" : "✗"}${r.id}`).join(" ");
}

for (const lesson of LESSONS) {
  console.log(`\n=== Lesson ${lesson.order}: ${lesson.title} ===`);
  if (!CORRECT[lesson.id]) { console.log("  (no auto-test submission — skipped)"); continue; }
  const good = await gradeLesson(lesson, CORRECT[lesson.id]);
  console.log(`  correct submission → ${good.passed ? "PASSED ✓" : "DID NOT PASS ✗"}   [${summary(good)}]`);
  const bad = await gradeLesson(lesson, WRONG[lesson.id]);
  console.log(`  realistic mistake  → ${bad.passed ? "PASSED — UNEXPECTED ✗" : "correctly failed ✓"}   [${summary(bad)}]`);
  for (const r of bad.results) if (!r.pass) console.log(`             ↳ ${r.label}\n               hint: ${r.hint}`);
}
console.log("");
