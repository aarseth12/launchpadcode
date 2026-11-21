import type { Lesson } from "./grader.ts";
import { HARDWARE_SVG, DATAFLOW_SVG, LOOP_SVG, MECANUM_SVG } from "./diagrams.ts";

const IMPORTS = `// Imports — these bring in the FTC SDK classes this program uses.
import com.qualcomm.robotcore.eventloop.opmode.LinearOpMode;
import com.qualcomm.robotcore.eventloop.opmode.TeleOp;
import com.qualcomm.robotcore.hardware.DcMotor;
import com.qualcomm.robotcore.hardware.DcMotorSimple;
import com.qualcomm.robotcore.hardware.Servo;`;

// The first full OpMode students meet — shared by lesson 1's worked example and its "colors" quiz.
const HELLO_ROBOT_CODE = `@TeleOp(name = "Hello Robot")          // shows up in the TeleOp list on the Driver Station
public class HelloRobot extends LinearOpMode {
    @Override
    public void runOpMode() {
        waitForStart();                    // wait for the driver to press PLAY
        while (opModeIsActive()) {         // loop until the OpMode is stopped
            // Queue a value to display, with a label the driver will read:
            telemetry.addData("status", "Hello, driver!");
            // Push everything we queued to the Driver Station screen:
            telemetry.update();
        }
    }
}`;

export const LESSONS: Lesson[] = [
  {
    id: "intro",
    order: 0,
    title: "How the Robot Works",
    concepts: ["Control Hub", "Driver Station", "the control loop"],
    instructions: `# How the Robot Works

Your code runs on the robot's **Control Hub**; the **Driver Station** sends the controls over wifi; and a fast **control loop** keeps everything responding in real time.`,
    tutorial: [
      {
        kind: "read",
        title: "The robot is a computer",
        body: `Your robot has a small computer on it called the **Control Hub**. Everything the robot does — reading sensors, spinning motors — is run by code on that Control Hub. When you write a program, it runs *there*, on the robot itself.`,
      },
      {
        kind: "diagram",
        label: "MEET THE HARDWARE",
        title: "The three pieces",
        svg: HARDWARE_SVG,
        caption: `Three devices work together: the **controller** you hold, the **Driver Station** that carries it, and the **Control Hub** on the robot that runs your code and connects to every motor and sensor.`,
      },
      {
        kind: "read",
        title: "The Driver Station",
        body: `During a match the driver holds the **Driver Station** — a phone or laptop — with a game controller (gamepad) plugged into it. The Driver Station reads the driver's stick and button presses and sends them over **wifi** to the Control Hub.\n\nSo the path is: controller → Driver Station → (wifi) → Control Hub → your code.`,
      },
      {
        kind: "diagram",
        label: "HOW IT WORKS",
        title: "How information flows",
        svg: DATAFLOW_SVG,
        caption: `Watch the path light up: the **controller** sends your button press down the USB cable to the **Driver Station**, which beams it over **Wi-Fi** to the **Control Hub** — which then drives the right **motors and sensors** through its ports. The whole trip repeats many times a second.`,
      },
      {
        kind: "read",
        title: "You only edit one file",
        body: `The Control Hub runs a *lot* of software — the FTC SDK handles the wifi, the motors, the timing, and much more. The good news: to control your robot you write code in just **one place**, your **OpMode**. That single file holds your logic, and it's what every lesson here has you edit.`,
      },
      {
        kind: "read",
        title: "The control loop",
        body: `Your OpMode has a loop that runs **over and over, many times a second** — each trip through it takes only a few milliseconds. Every trip does the same job: read the latest gamepad values, decide what to do, and set the motor powers. Because it repeats so fast, the robot reacts to the controls in real time.`,
      },
      {
        kind: "diagram",
        label: "THE OPMODE CYCLE",
        title: "The control loop, visualized",
        svg: LOOP_SVG,
        caption: `Setup runs **once**; then the loop spins: **Read** the inputs → **Decide** in your code → **Act** by setting the motor powers → back to the top, **many times a second**. It keeps looping until the OpMode is **stopped**.`,
      },
      {
        kind: "example",
        title: "The shape of every OpMode",
        body: `Almost every program you write has this exact shape — a one-time setup, then the fast loop:`,
        code: `@TeleOp(name = "My OpMode")          // appears in the Driver Station's TeleOp list
public class MyOpMode extends LinearOpMode {
    @Override
    public void runOpMode() {
        // (1) Setup — runs once. Grab your motors and sensors here.

        waitForStart();                  // wait for the driver to press PLAY

        // (2) The control loop — runs over and over, a few milliseconds each pass:
        while (opModeIsActive()) {
            // read the gamepad  ->  decide what to do  ->  set the motor powers
            // keep this quick so the robot stays responsive!
        }
    }
}`,
        explain: `The setup runs once, then \`waitForStart()\`, then the \`while (opModeIsActive())\` loop repeats until the OpMode is stopped. Almost all of your driving code lives **inside that loop**.`,
      },
      {
        kind: "read",
        title: "Keep the loop fast",
        body: `One habit to start building now: **don't block the loop.** The robot stays responsive only because each trip through the loop is quick. If a single trip takes a long time — say a 5-second \`sleep\`, or an inner \`while\` loop that spins for seconds — the robot stops reading the controls and **freezes** until that trip finishes.\n\nWe'll cover how to handle timing properly later. For now: keep each loop pass short, and let the loop itself do the repeating.`,
      },
      {
        kind: "read",
        title: "You've got the model",
        body: `That's the whole idea: your code runs on the **Control Hub**, the **Driver Station** feeds it the controls over wifi, and a fast **control loop** keeps everything live. Next, let's write your very first OpMode and make the robot talk back to you.`,
      },
    ],
  },

  {
    id: "telemetry",
    order: 1,
    title: "Hello Robot",
    concepts: ["OpMode lifecycle", "telemetry"],
    tutorial: [
      {
        kind: "read",
        title: "Where your code runs",
        body: `Your program runs on the **robot** — on a small computer called the Robot Controller. The driver, meanwhile, holds the **Driver Station** (a phone or laptop). They are two separate devices talking to each other over wifi.`,
      },
      {
        kind: "read",
        title: "Telemetry: the robot's dashboard",
        body: `So how does the driver see what the robot is doing — a sensor reading, a motor's power, whether a target was reached? **Telemetry.** Code running on the robot uses telemetry to send labelled values *back* to the Driver Station screen, where the driver can read them. Think of it as the robot's dashboard.`,
      },
      {
        kind: "read",
        title: "Two steps: addData, then update",
        body: `Showing telemetry is always two steps:\n\n1. \`telemetry.addData("label", value);\` — queue one value, with a label.\n2. \`telemetry.update();\` — send everything you queued to the screen.\n\nIf you forget \`update()\`, nothing shows up. You normally call it once per loop, after your addData calls.`,
      },
      {
        kind: "example",
        title: "A complete OpMode",
        body: `This program shows a message on the Driver Station the whole time it runs:`,
        code: HELLO_ROBOT_CODE,
        legend: true,
        explain: `\`addData("status", "Hello, driver!")\` queues the line **status: Hello, driver!**. \`update()\` is what actually sends it to the screen — without it, the driver sees nothing.`,
      },
      {
        kind: "quiz",
        title: "Reading the colors",
        intro: `The editor colors your code to make it easier to read. Look at the OpMode again, then answer these quick questions about what the colors mean.`,
        code: HELLO_ROBOT_CODE,
        questions: [
          {
            q: `The **green** text, like \`// wait for the driver to press PLAY\`, is…`,
            options: ["a robot command", "a code error", "a human's note", "a driver message"],
            answer: 2,
            explain: `Green marks a **comment**. Comments start with \`//\`; they're notes for people reading the code, and the computer skips right over them when it runs.`,
          },
          {
            q: `The **blue** words \`public\`, \`class\`, and \`while\` are…`,
            options: ["Java keywords", "invented names", "motor names", "code comments"],
            answer: 0,
            explain: `Blue marks **keywords** — words that are part of the Java language itself. You can't use them as your own names, and nearly every program uses them.`,
          },
          {
            q: `\`LinearOpMode\`, shown in **teal**, is…`,
            options: ["a Java keyword", "a text value", "a number value", "a class name"],
            answer: 3,
            explain: `Teal marks **types** — class names. \`LinearOpMode\` is the kind of program you're writing, and your class \`HelloRobot\` extends it.`,
          },
          {
            q: `The **orange** text \`"Hello, driver!"\` (in quotes) is…`,
            options: ["a method name", "a text value", "a code comment", "a Java keyword"],
            answer: 1,
            explain: `Anything inside double quotes is a **string**: literal text. Here it's the message shown on the Driver Station.`,
          },
          {
            q: `The **yellow** words \`addData()\` and \`update()\` are…`,
            options: ["keywords in Java", "pieces of text", "actions you call", "notes for humans"],
            answer: 2,
            explain: `Yellow marks **methods** — the actions. \`telemetry.addData(...)\` runs the addData action on \`telemetry\`, and \`telemetry.update()\` runs update.`,
          },
        ],
      },
      {
        kind: "type",
        prompt: `**Your turn.** Type the line that queues a value labelled \`status\` with the message \`Hello!\`.`,
        answer: ['telemetry.addData("status", "Hello!");'],
        hint: `Pattern: \`telemetry.addData("<label>", <value>);\` — here both the label and the message are text in quotes.`,
        explain: `Remember, this only *queues* the value — it won't appear until you send it.`,
      },
      {
        kind: "type",
        prompt: `Now type the line that sends your queued data to the Driver Station.`,
        answer: ['telemetry.update();'],
        hint: `It's one short call on \`telemetry\`, with no arguments.`,
        explain: `Call this once each loop, after all of your addData lines.`,
      },
      {
        kind: "read",
        title: "Now you try",
        body: `In the practice challenge you'll add telemetry yourself, then press **Run** and watch your value appear in the **Telemetry** panel beside the simulator — that panel is the sim's Driver Station.`,
      },
    ],
    instructions: `# Hello Robot

Every FTC program is an **OpMode**. A \`LinearOpMode\` runs \`runOpMode()\` once: you set
things up, call \`waitForStart()\`, then loop while \`opModeIsActive()\`.

**Telemetry** is how the robot talks back to you — like \`System.out.println\`, but on the
Driver Station. Show a message:

\`\`\`java
telemetry.addData("status", "Hello!");
telemetry.update();   // don't forget this — it pushes the data out
\`\`\`

**Goal:** report at least one telemetry value while the OpMode runs.`,
    starterCode: `${IMPORTS}

@TeleOp(name = "Hello Robot")          // shows up in the TeleOp list on the Driver Station
public class HelloRobot extends LinearOpMode {
    @Override
    public void runOpMode() {
        waitForStart();                // wait for the driver to press PLAY
        while (opModeIsActive()) {     // loop until the OpMode is stopped
            // TODO: report a value with telemetry.addData("label", value);
            // TODO: then send it to the Driver Station with telemetry.update();

        }
    }
}`,
    scenario: { durationMs: 700, steps: [] },
    checks: [
      {
        id: "telemetry",
        label: "Robot reports at least one telemetry value",
        hint: 'Inside the loop: telemetry.addData("status", "Hello!"); then telemetry.update();',
        test: (t) => Object.keys(t.telemetry).length > 0,
      },
    ],
  },

  {
    id: "motor",
    order: 2,
    title: "Spin a Motor",
    concepts: ["DcMotor", "setPower"],
    tutorial: [
      {
        kind: "read",
        title: "What a motor is",
        body: `In FTC a motor is a **\`DcMotor\`**. Before you can use one, you ask the robot for it by name — the names come from the robot's configuration. In this simulator the four drive motors are \`frontLeft\`, \`frontRight\`, \`backLeft\`, and \`backRight\`.`,
      },
      {
        kind: "read",
        title: "Power runs from -1.0 to 1.0",
        body: `You spin a motor by setting its **power**: \`-1.0\` is full reverse, \`0\` is stop, and \`1.0\` is full forward. So \`0.5\` means half speed forward.`,
      },
      {
        kind: "example",
        title: "A complete OpMode",
        body: `Here is the whole program that spins one motor. Read it line by line:`,
        code: `@TeleOp(name = "Spin a Motor")         // shows up in the TeleOp list on the Driver Station
public class SpinMotor extends LinearOpMode {
    @Override
    public void runOpMode() {
        // Get the motor named "frontLeft" from the robot's configuration:
        DcMotor frontLeft = hardwareMap.get(DcMotor.class, "frontLeft");

        waitForStart();                    // wait for the driver to press PLAY
        while (opModeIsActive()) {         // loop until the OpMode is stopped
            frontLeft.setPower(0.5);       // spin the motor forward at half power
        }
    }
}`,
        explain: `\`hardwareMap.get(DcMotor.class, "frontLeft")\` fetches the motor named **frontLeft** and stores it in a variable. \`waitForStart()\` pauses until you press play. Then, again and again, \`frontLeft.setPower(0.5)\` keeps it spinning at half speed.`,
      },
      {
        kind: "type",
        prompt: `**Your turn — type it out.** Write the line that fetches the motor named \`frontLeft\` into a \`DcMotor\` variable also called \`frontLeft\`. Don't forget the semicolon.`,
        answer: ['DcMotor frontLeft = hardwareMap.get(DcMotor.class, "frontLeft");'],
        hint: `Pattern: \`DcMotor <name> = hardwareMap.get(DcMotor.class, "<configName>");\``,
        explain: `That same pattern brings *any* hardware device into your code.`,
      },
      {
        kind: "type",
        prompt: `Now write the line that spins \`frontLeft\` forward at half power.`,
        answer: ['frontLeft.setPower(0.5);'],
        hint: `It's the variable name, a dot, then \`setPower(...)\` with a number from -1.0 to 1.0.`,
        explain: `Any power above 0 spins it forward; a negative power spins it backward.`,
      },
      {
        kind: "read",
        title: "Now you try",
        body: `Time to put it together yourself. In the practice challenge you'll get the \`frontLeft\` motor and give it power inside the loop, then press **Run** to watch it spin in the simulator and **Check** to pass the lesson.`,
      },
    ],
    instructions: `# Spin a Motor

A motor is a \`DcMotor\`. You grab it from the robot's configuration by name:

\`\`\`java
DcMotor frontLeft = hardwareMap.get(DcMotor.class, "frontLeft");
\`\`\`

Then you command it with a **power** from \`-1.0\` (full reverse) to \`1.0\` (full forward):

\`\`\`java
frontLeft.setPower(0.5);
\`\`\`

**Goal:** make the \`frontLeft\` motor spin forward.`,
    starterCode: `${IMPORTS}

@TeleOp(name = "Spin a Motor")
public class SpinMotor extends LinearOpMode {
    @Override
    public void runOpMode() {
        // The frontLeft motor is already fetched from the robot's configuration:
        DcMotor frontLeft = hardwareMap.get(DcMotor.class, "frontLeft");

        waitForStart();                // wait for the driver to press PLAY
        while (opModeIsActive()) {     // loop until the OpMode is stopped
            // TODO: make the frontLeft motor spin — call frontLeft.setPower(...) with a value from -1.0 to 1.0

        }
    }
}`,
    scenario: { durationMs: 700, steps: [] },
    checks: [
      {
        id: "spin",
        label: "frontLeft motor turns (power > 0)",
        hint: "Call frontLeft.setPower(0.5); inside the loop.",
        test: (t) => t.states.some((s) => Math.abs(s.fl) > 0.1),
      },
    ],
  },

  {
    id: "mecanum",
    order: 3,
    title: "Mecanum Drive",
    concepts: ["mecanum kinematics", "setDirection", "strafing"],
    tutorial: [
      {
        kind: "read",
        title: "What mecanum wheels do",
        body: `Mecanum wheels have angled rollers, which lets your robot do something normal wheels can't: **strafe** — slide straight sideways — as well as drive forward/back and turn. You get all of it by choosing the four wheel powers cleverly.`,
      },
      {
        kind: "read",
        title: "Three inputs: axial, lateral, yaw",
        body: `You blend three driver inputs:\n\n- **axial** — forward / back (\`-gamepad1.left_stick_y\`)\n- **lateral** — strafe left / right (\`gamepad1.left_stick_x\`)\n- **yaw** — turn (\`gamepad1.right_stick_x\`)\n\nEach wheel gets a different *mix* of these three.`,
      },
      {
        kind: "read",
        title: "The mixing formula",
        body: `The standard mecanum mix is:\n\n\`\`\`java\nfl = axial + lateral + yaw\nfr = axial - lateral - yaw\nbl = axial - lateral + yaw\nbr = axial + lateral - yaw\n\`\`\`\n\nThen each is divided by a \`denom\` so no power ever goes past 1.0.`,
      },
      {
        kind: "diagram",
        label: "THE FORMULA IN ACTION",
        title: "How the mix moves the robot",
        svg: MECANUM_SVG,
        caption: `Each panel is a top-down robot — the diagonal lines are the wheels' angled **rollers**. Feed in one input at a time and the formula sets each wheel's spin (**green ↑** forward, **red ↓** backward); the rollers turn those spins into a force, and the four forces add up to the robot's motion (the **teal arrow**).\n\n- **axial** → all four spin forward → robot **drives forward**.\n- **lateral** → \`fl\`/\`br\` forward, \`fr\`/\`bl\` backward → robot **strafes right** without turning.\n- **yaw** → left wheels forward, right wheels backward → robot **spins clockwise**.\n\nThose +1.0 / −1.0 values are exactly what the formula produces — and the same colors you'll see on the wheels in the sim.`,
      },
      {
        kind: "read",
        title: "Reverse the right side",
        body: `One catch: the right-side motors are mounted **mirrored**. If you don't reverse them, that same formula makes the robot **spin** instead of driving straight. So during setup you reverse \`frontRight\` and \`backRight\` with \`setDirection\`.`,
      },
      {
        kind: "example",
        title: "A complete mecanum OpMode",
        body: `Putting it all together:`,
        code: `@TeleOp(name = "Mecanum Drive")          // appears in the Driver Station's TeleOp list
public class MecanumDrive extends LinearOpMode {
    @Override
    public void runOpMode() {
        // Get the four drive motors from the robot's configuration:
        DcMotor fl = hardwareMap.get(DcMotor.class, "frontLeft");
        DcMotor fr = hardwareMap.get(DcMotor.class, "frontRight");
        DcMotor bl = hardwareMap.get(DcMotor.class, "backLeft");
        DcMotor br = hardwareMap.get(DcMotor.class, "backRight");

        // Right-side motors are mirrored — reverse them so + power drives forward:
        fr.setDirection(DcMotorSimple.Direction.REVERSE);
        br.setDirection(DcMotorSimple.Direction.REVERSE);

        waitForStart();                      // wait for the driver to press PLAY
        while (opModeIsActive()) {
            double axial   = -gamepad1.left_stick_y;   // forward / back (stick up is negative!)
            double lateral =  gamepad1.left_stick_x;    // strafe left / right
            double yaw     =  gamepad1.right_stick_x;   // turn

            // Scale by the total so no wheel power exceeds 1.0:
            double denom = Math.max(Math.abs(axial) + Math.abs(lateral) + Math.abs(yaw), 1.0);

            // Mix the three inputs into each wheel's power:
            fl.setPower((axial + lateral + yaw) / denom);
            fr.setPower((axial - lateral - yaw) / denom);
            bl.setPower((axial - lateral + yaw) / denom);
            br.setPower((axial + lateral - yaw) / denom);
        }
    }
}`,
        explain: `The reverse lines fix the mirrored mounting; the four power lines turn axial/lateral/yaw into wheel powers; \`denom\` keeps them in range. Run this and you can strafe.`,
      },
      {
        kind: "type",
        prompt: `**Type it out.** Reverse the \`frontRight\` motor (\`fr\`) so positive power drives it forward.`,
        answer: ['fr.setDirection(DcMotorSimple.Direction.REVERSE);'],
        hint: `Pattern: \`<motor>.setDirection(DcMotorSimple.Direction.REVERSE);\``,
        explain: `You'd do exactly the same for \`br\` (backRight).`,
      },
      {
        kind: "type",
        prompt: `Now type the \`frontLeft\` (\`fl\`) power line — the mix \`axial + lateral + yaw\`, divided by \`denom\`.`,
        answer: ['fl.setPower((axial + lateral + yaw) / denom);'],
        hint: `\`fl.setPower((axial + lateral + yaw) / denom);\` — note the double parentheses.`,
        explain: `Each wheel uses the same three inputs with a different +/- pattern.`,
      },
      {
        kind: "read",
        title: "Now you try",
        body: `In the practice challenge you'll add the two reverse lines and the four power lines yourself, then **Run** to drive with the keyboard or a controller, and **Check** to grade it — it tests that you drive forward, strafe right, and *don't* spin.`,
      },
    ],
    instructions: `# Mecanum Drive

Mecanum wheels can drive forward, **strafe sideways**, and turn — by mixing three inputs:
**axial** (forward), **lateral** (strafe), and **yaw** (turn). The standard mix:

\`\`\`java
fl.setPower((axial + lateral + yaw) / denom);
fr.setPower((axial - lateral - yaw) / denom);
bl.setPower((axial - lateral + yaw) / denom);
br.setPower((axial + lateral - yaw) / denom);
\`\`\`

The right-side motors are mounted mirrored, so you must **reverse** them or the robot
spins instead of driving straight:

\`\`\`java
fr.setDirection(DcMotorSimple.Direction.REVERSE);
br.setDirection(DcMotorSimple.Direction.REVERSE);
\`\`\`

**Goal:** drive forward, then strafe right — without spinning.`,
    starterCode: `${IMPORTS}

@TeleOp(name = "Mecanum Drive")
public class MecanumDrive extends LinearOpMode {
    @Override
    public void runOpMode() {
        // Get the four drive motors from the robot's configuration:
        DcMotor fl = hardwareMap.get(DcMotor.class, "frontLeft");
        DcMotor fr = hardwareMap.get(DcMotor.class, "frontRight");
        DcMotor bl = hardwareMap.get(DcMotor.class, "backLeft");
        DcMotor br = hardwareMap.get(DcMotor.class, "backRight");

        // TODO: the right-side motors are mounted mirrored — reverse fr and br here
        //       (use setDirection(DcMotorSimple.Direction.REVERSE))

        waitForStart();                                 // wait for the driver to press PLAY
        while (opModeIsActive()) {
            double axial   = -gamepad1.left_stick_y;    // forward / back (stick up is negative!)
            double lateral =  gamepad1.left_stick_x;    // strafe left / right
            double yaw     =  gamepad1.right_stick_x;    // turn

            // Scale so no single motor power goes past 1.0:
            double denom   = Math.max(Math.abs(axial) + Math.abs(lateral) + Math.abs(yaw), 1.0);

            // TODO: mix axial, lateral, yaw into each motor's power (each over denom)
            fl.setPower(0);
            fr.setPower(0);
            bl.setPower(0);
            br.setPower(0);

            telemetry.addData("status", "driving");     // show status on the Driver Station
            telemetry.update();
        }
    }
}`,
    scenario: {
      durationMs: 1400,
      steps: [
        { atMs: 0, g1: { ly: -1 } },   // forward
        { atMs: 600, g1: { lx: 1 } },  // then strafe right
        { atMs: 1200, g1: {} },        // release
      ],
    },
    checks: [
      {
        id: "forward",
        label: "Drives forward when you push the stick up",
        hint: "Pushing up makes axial positive (axial = -left_stick_y). Each wheel needs + axial.",
        test: (t) => t.states.some((s) => s.y > 85),
      },
      {
        id: "strafe-right",
        label: "Strafes right when you push the stick right",
        hint: "Strafing right means lateral is positive — it should add to fl & br, subtract from fr & bl.",
        test: (t) => { const s = t.states[t.states.length - 1]; return !!s && s.x > 90; },
      },
      {
        id: "no-spin",
        label: "Drives straight without spinning",
        hint: "If it spins, the right-side motors aren't reversed — setDirection(DcMotorSimple.Direction.REVERSE) on frontRight and backRight.",
        test: (t) => t.states.every((s) => Math.abs(s.h) < 0.35),
      },
    ],
  },

  {
    id: "servo",
    order: 4,
    title: "Open the Claw",
    concepts: ["Servo", "setPosition"],
    tutorial: [
      {
        kind: "read",
        title: "Servos hold a position",
        body: `A motor spins; a **servo** holds a precise **position**. Servos move arms, wrists, and **claws**. You command a position from \`0.0\` to \`1.0\` — think of it as 0% to 100% of the servo's range. For a claw, one end is *closed* and the other is *open*.`,
      },
      {
        kind: "read",
        title: "Get it, then set it",
        body: `Just like a motor, you fetch a servo from the configuration by name (here it's called \`claw\`), then set its position:\n\n\`\`\`java\nServo claw = hardwareMap.get(Servo.class, "claw");\nclaw.setPosition(1.0);   // fully open\n\`\`\``,
      },
      {
        kind: "example",
        title: "A complete OpMode",
        body: `This opens the claw and holds it open:`,
        code: `@TeleOp(name = "Open the Claw")        // appears in the Driver Station's TeleOp list
public class ClawOpMode extends LinearOpMode {
    @Override
    public void runOpMode() {
        // Get the servo named "claw" from the robot's configuration:
        Servo claw = hardwareMap.get(Servo.class, "claw");

        waitForStart();                    // wait for the driver to press PLAY
        while (opModeIsActive()) {
            claw.setPosition(1.0);         // hold the claw fully open (0.0 = closed)
        }
    }
}`,
        explain: `\`hardwareMap.get(Servo.class, "claw")\` grabs the servo; \`claw.setPosition(1.0)\` moves it to the fully-open end. \`0.0\` would close it, \`0.5\` would be halfway.`,
      },
      {
        kind: "type",
        prompt: `**Type it out.** Get the servo named \`claw\` into a \`Servo\` variable called \`claw\`.`,
        answer: ['Servo claw = hardwareMap.get(Servo.class, "claw");'],
        hint: `Pattern: \`Servo <name> = hardwareMap.get(Servo.class, "<configName>");\``,
        explain: `Same shape as getting a motor — just \`Servo\` instead of \`DcMotor\`.`,
      },
      {
        kind: "type",
        prompt: `Now type the line that opens the claw all the way.`,
        answer: ['claw.setPosition(1.0);'],
        hint: `Servo positions run 0.0 (closed) to 1.0 (open).`,
        explain: `Any value from 0.0 to 1.0 works; 1.0 is fully open.`,
      },
      {
        kind: "read",
        title: "Now you try",
        body: `In the practice challenge you'll open the claw yourself, then **Run** to watch the claw spread open on the robot, and **Check** to pass.`,
      },
    ],
    instructions: `# Open the Claw

A **servo** holds a position from \`0.0\` to \`1.0\`. The claw servo is named \`claw\` — \`0.0\` is closed, \`1.0\` is open.

**Goal:** open the claw.`,
    starterCode: `${IMPORTS}

@TeleOp(name = "Open the Claw")
public class ClawOpMode extends LinearOpMode {
    @Override
    public void runOpMode() {
        // The claw servo is already fetched from the robot's configuration:
        Servo claw = hardwareMap.get(Servo.class, "claw");

        waitForStart();                // wait for the driver to press PLAY
        while (opModeIsActive()) {
            // TODO: open the claw — call claw.setPosition(...) with a value from 0.0 to 1.0

        }
    }
}`,
    scenario: { durationMs: 700, steps: [] },
    checks: [
      {
        id: "open",
        label: "The claw opens (servo position near 1.0)",
        hint: "Call claw.setPosition(1.0); inside the loop.",
        test: (t) => t.states.some((s) => (s.claw ?? 0) > 0.8),
      },
    ],
  },

  {
    id: "touch",
    order: 5,
    title: "Touch the Wall",
    concepts: ["TouchSensor", "isPressed", "reacting to a sensor"],
    tutorial: [
      {
        kind: "read",
        title: "A sensor lets the robot feel",
        body: `So far the robot has driven **blind**. A **sensor** lets it notice the world and react. The simplest one is a **touch sensor** — a button. It answers a single yes/no question: *am I being pressed right now?* Robots use one to tell when an arm has reached its limit, or when the robot has bumped into a wall.`,
      },
      {
        kind: "read",
        title: "isPressed() gives you true or false",
        body: `You fetch a touch sensor from the configuration by name (ours is called \`touch\`), then read it with \`isPressed()\`. It hands back a **boolean** — \`true\` when pressed, \`false\` when not:\n\n\`\`\`java\nTouchSensor touch = hardwareMap.get(TouchSensor.class, "touch");\nboolean pressed = touch.isPressed();   // true or false\n\`\`\``,
      },
      {
        kind: "read",
        title: "Autonomous: the robot acts on its own",
        body: `This program runs **by itself** — no driver on the controls. We mark that with \`@Autonomous\` instead of \`@TeleOp\`. Autonomous is exactly where sensors shine: the robot drives forward and uses the touch sensor to decide *when to stop*, all on its own.`,
      },
      {
        kind: "example",
        title: "Drive until you touch the wall",
        body: `The robot rolls forward and stops the instant its bumper presses the wall:`,
        code: `@Autonomous(name = "Touch the Wall")     // runs on its own — no driver
public class TouchTheWall extends LinearOpMode {
    @Override
    public void runOpMode() {
        // The four drive motors are set up for you (right side reversed so + drives forward):
        DcMotor fl = hardwareMap.get(DcMotor.class, "frontLeft");
        DcMotor fr = hardwareMap.get(DcMotor.class, "frontRight");
        DcMotor bl = hardwareMap.get(DcMotor.class, "backLeft");
        DcMotor br = hardwareMap.get(DcMotor.class, "backRight");
        fr.setDirection(DcMotorSimple.Direction.REVERSE);
        br.setDirection(DcMotorSimple.Direction.REVERSE);

        // Get the touch sensor named "touch" from the configuration:
        TouchSensor touch = hardwareMap.get(TouchSensor.class, "touch");

        waitForStart();                      // wait for the driver to press PLAY
        while (opModeIsActive()) {
            // Stop if the bumper is pressing the wall; otherwise drive forward at 0.6:
            double power;
            if (touch.isPressed()) {
                power = 0.0;            // pressed: stop
            } else {
                power = 0.6;            // not pressed: drive forward
            }

            fl.setPower(power);              // same power to all four wheels = drive straight
            fr.setPower(power);
            bl.setPower(power);
            br.setPower(power);

            telemetry.addData("pressed", touch.isPressed());  // show the sensor on the Driver Station
            telemetry.update();
        }
    }
}`,
        explain: `The \`if/else\` chooses the power: **if** \`touch.isPressed()\` is true, \`power\` becomes \`0.0\` (stop); **else** it's \`0.6\` (drive). So the robot keeps rolling forward until the bumper hits the wall, then halts.`,
      },
      {
        kind: "type",
        prompt: `**Type it out.** Get the touch sensor named \`touch\` into a \`TouchSensor\` variable also called \`touch\`.`,
        answer: ['TouchSensor touch = hardwareMap.get(TouchSensor.class, "touch");'],
        hint: `Pattern: \`TouchSensor <name> = hardwareMap.get(TouchSensor.class, "<configName>");\``,
        explain: `Same shape as getting a motor or a servo — just \`TouchSensor\` this time.`,
      },
      {
        kind: "type",
        prompt: `Now type the line that **reports** the sensor to the Driver Station: \`addData\` with the label \`"pressed"\` and the value \`touch.isPressed()\`.`,
        answer: ['telemetry.addData("pressed", touch.isPressed());'],
        hint: `Pattern: \`telemetry.addData("label", value);\` — the label is \`"pressed"\`, the value is \`touch.isPressed()\`.`,
        explain: `\`telemetry.update();\` then pushes it to the screen, so you can watch \`pressed\` flip from false to true as the bumper reaches the wall.`,
      },
      {
        kind: "read",
        title: "Now you try",
        body: `In the practice challenge you'll get the sensor and use it to stop at the wall, then **Run** to watch the robot roll up and stop, and **Check** to grade it — it tests that you drive forward *and* stop when the bumper presses.`,
      },
    ],
    instructions: `# Touch the Wall

A **touch sensor** is a button: \`touch.isPressed()\` is \`true\` while it's pressed, \`false\` otherwise. Fetch it like any device:

\`\`\`java
TouchSensor touch = hardwareMap.get(TouchSensor.class, "touch");
\`\`\`

This OpMode runs on its own (\`@Autonomous\`): drive forward, and **stop when the bumper presses the wall**.

\`\`\`java
double power;
if (touch.isPressed()) {
    power = 0.0;   // pressed: stop
} else {
    power = 0.6;   // else drive forward
}
\`\`\`

**Goal:** drive forward, then stop the moment the touch sensor is pressed.`,
    starterCode: `${IMPORTS}
import com.qualcomm.robotcore.eventloop.opmode.Autonomous;  // an OpMode that runs by itself
import com.qualcomm.robotcore.hardware.TouchSensor;          // a pressed / not-pressed sensor

@Autonomous(name = "Touch the Wall")
public class TouchTheWall extends LinearOpMode {
    @Override
    public void runOpMode() {
        // The four drive motors are set up for you (right side reversed):
        DcMotor fl = hardwareMap.get(DcMotor.class, "frontLeft");
        DcMotor fr = hardwareMap.get(DcMotor.class, "frontRight");
        DcMotor bl = hardwareMap.get(DcMotor.class, "backLeft");
        DcMotor br = hardwareMap.get(DcMotor.class, "backRight");
        fr.setDirection(DcMotorSimple.Direction.REVERSE);
        br.setDirection(DcMotorSimple.Direction.REVERSE);

        // TODO: get the touch sensor named "touch" from the configuration
        //       TouchSensor touch = hardwareMap.get(TouchSensor.class, "touch");

        waitForStart();                // wait for the driver to press PLAY
        while (opModeIsActive()) {
            // TODO: drive at 0.6, but set power to 0.0 when touch.isPressed()
            double power = 0.6;        // <-- make this become 0.0 when the sensor is pressed

            fl.setPower(power);        // same power to all four wheels = drive straight
            fr.setPower(power);
            bl.setPower(power);
            br.setPower(power);

            // TODO: report the sensor: telemetry.addData("pressed", touch.isPressed()); then telemetry.update();

        }
    }
}`,
    scenario: { durationMs: 3000, steps: [] },
    checks: [
      {
        id: "drive",
        label: "Drives forward toward the wall",
        hint: "Give all four wheels the same positive power (e.g. 0.6) so the robot rolls straight forward.",
        test: (t) => t.states.some((s) => s.y > 110),
      },
      {
        id: "stop",
        label: "Stops when the touch sensor presses the wall",
        hint: "Use an if/else on touch.isPressed(): if (touch.isPressed()) { power = 0.0; } else { power = 0.6; }",
        test: (t) => { const s = t.states[t.states.length - 1]; return !!s && s.touch === true && Math.abs(s.fl) < 0.1; },
      },
    ],
  },

  {
    id: "distance",
    order: 6,
    title: "Stop at a Distance",
    concepts: ["DistanceSensor", "getDistance", "DistanceUnit"],
    tutorial: [
      {
        kind: "read",
        title: "Seeing before touching",
        body: `The touch sensor only spoke up the instant you **hit** the wall. A **distance sensor** is better for planning ahead: it tells you *how far away* something is **before** you reach it. Robots use one to stop a set distance from a wall, line up on a target, or notice an obstacle ahead.`,
      },
      {
        kind: "read",
        title: "getDistance, in the unit you ask for",
        body: `You fetch a distance sensor by name (ours is \`distance\`), then read it with \`getDistance\`, telling it which **unit** you want — \`DistanceUnit.CM\`, \`DistanceUnit.MM\`, or \`DistanceUnit.INCH\`:\n\n\`\`\`java\nDistanceSensor distance = hardwareMap.get(DistanceSensor.class, "distance");\ndouble cm = distance.getDistance(DistanceUnit.CM);   // e.g. 63.0\n\`\`\`\n\nIt hands back a \`double\` you can compare — for example, *is the wall closer than 25 cm?*`,
      },
      {
        kind: "example",
        title: "Drive, then stop 25 cm short",
        body: `This \`@Autonomous\` OpMode rolls forward and stops about 25 cm from the wall — without crashing into it:`,
        code: `@Autonomous(name = "Stop at a Distance")     // runs on its own — no driver
public class StopAtDistance extends LinearOpMode {
    @Override
    public void runOpMode() {
        // The four drive motors are set up for you (right side reversed so + drives forward):
        DcMotor fl = hardwareMap.get(DcMotor.class, "frontLeft");
        DcMotor fr = hardwareMap.get(DcMotor.class, "frontRight");
        DcMotor bl = hardwareMap.get(DcMotor.class, "backLeft");
        DcMotor br = hardwareMap.get(DcMotor.class, "backRight");
        fr.setDirection(DcMotorSimple.Direction.REVERSE);
        br.setDirection(DcMotorSimple.Direction.REVERSE);

        // Get the distance sensor named "distance" from the configuration:
        DistanceSensor distance = hardwareMap.get(DistanceSensor.class, "distance");

        waitForStart();                      // wait for the driver to press PLAY
        while (opModeIsActive()) {
            // Read how far away the wall ahead is, in centimeters:
            double cm = distance.getDistance(DistanceUnit.CM);

            // Stop once the wall is closer than 25 cm; otherwise drive forward at 0.5:
            double power;
            if (cm < 25) {
                power = 0.0;            // within 25 cm: stop
            } else {
                power = 0.5;            // still far: drive forward
            }

            fl.setPower(power);              // same power to all four wheels = drive straight
            fr.setPower(power);
            bl.setPower(power);
            br.setPower(power);

            telemetry.addData("distance (cm)", cm);   // watch it count down on the Driver Station
            telemetry.update();
        }
    }
}`,
        explain: `Each loop reads \`cm\`, then the \`if/else\` picks the power: **if** \`cm < 25\`, \`power\` becomes \`0.0\` (stop); **else** it's \`0.5\` (keep driving). The robot eases up to the wall and parks a hand's-width away.`,
      },
      {
        kind: "type",
        prompt: `**Type it out.** Get the distance sensor named \`distance\` into a \`DistanceSensor\` variable also called \`distance\`.`,
        answer: ['DistanceSensor distance = hardwareMap.get(DistanceSensor.class, "distance");'],
        hint: `Pattern: \`DistanceSensor <name> = hardwareMap.get(DistanceSensor.class, "<configName>");\``,
        explain: `Same shape as every other device — just \`DistanceSensor\` this time.`,
      },
      {
        kind: "type",
        prompt: `Now read the distance to the wall, in centimeters, into a \`double\` called \`cm\`.`,
        answer: ['double cm = distance.getDistance(DistanceUnit.CM);'],
        hint: `Call \`distance.getDistance(...)\` and pass the unit \`DistanceUnit.CM\`.`,
        explain: `Swap in \`DistanceUnit.MM\` or \`DistanceUnit.INCH\` if you'd rather have millimeters or inches.`,
      },
      {
        kind: "read",
        title: "Now you try",
        body: `In the practice challenge you'll read the sensor and stop before the wall, then **Run** to watch the cyan beam shrink as the robot eases up and parks, and **Check** to grade it — it tests that you drive close *and* stop without crashing.`,
      },
    ],
    instructions: `# Stop at a Distance

The touch sensor spoke up only when you **hit** the wall. A **distance sensor** tells you how far away something is **before** you reach it — so you can stop at a precise distance.

\`\`\`java
DistanceSensor distance = hardwareMap.get(DistanceSensor.class, "distance");
double cm = distance.getDistance(DistanceUnit.CM);
\`\`\`

This \`@Autonomous\` OpMode drives forward and stops about 25 cm from the wall:

\`\`\`java
double power;
if (cm < 25) {
    power = 0.0;   // close enough: stop
} else {
    power = 0.5;   // else drive forward
}
\`\`\`

**Goal:** drive toward the wall, then stop a short distance away — without crashing into it.`,
    starterCode: `${IMPORTS}
import com.qualcomm.robotcore.eventloop.opmode.Autonomous;                 // an OpMode that runs by itself
import com.qualcomm.robotcore.hardware.DistanceSensor;                     // reads how far away things are
import org.firstinspires.ftc.robotcore.external.navigation.DistanceUnit;   // cm / mm / inches

@Autonomous(name = "Stop at a Distance")
public class StopAtDistance extends LinearOpMode {
    @Override
    public void runOpMode() {
        // The four drive motors are set up for you (right side reversed):
        DcMotor fl = hardwareMap.get(DcMotor.class, "frontLeft");
        DcMotor fr = hardwareMap.get(DcMotor.class, "frontRight");
        DcMotor bl = hardwareMap.get(DcMotor.class, "backLeft");
        DcMotor br = hardwareMap.get(DcMotor.class, "backRight");
        fr.setDirection(DcMotorSimple.Direction.REVERSE);
        br.setDirection(DcMotorSimple.Direction.REVERSE);

        // TODO: get the distance sensor named "distance" from the configuration
        //       DistanceSensor distance = hardwareMap.get(DistanceSensor.class, "distance");

        waitForStart();                // wait for the driver to press PLAY
        while (opModeIsActive()) {
            // TODO: read the distance to the wall in cm:
            //       double cm = distance.getDistance(DistanceUnit.CM);

            // TODO: drive at 0.5, but set power to 0.0 once cm is below 25
            double power = 0.5;        // <-- make this become 0.0 when the wall is within 25 cm

            fl.setPower(power);        // same power to all four wheels = drive straight
            fr.setPower(power);
            bl.setPower(power);
            br.setPower(power);

            // TODO: report the reading: telemetry.addData("distance (cm)", cm); then telemetry.update();

        }
    }
}`,
    scenario: { durationMs: 3000, steps: [] },
    checks: [
      {
        id: "approach",
        label: "Drives up close to the wall",
        hint: "Give all four wheels the same positive power (e.g. 0.5) so the robot rolls toward the wall.",
        test: (t) => t.states.some((s) => (s.dist ?? 999) < 24),
      },
      {
        id: "stop-clear",
        label: "Stops before crashing into the wall",
        hint: "Read distance.getDistance(DistanceUnit.CM), then an if/else: if (cm < 25) { power = 0.0; } else { power = 0.5; }",
        test: (t) => { const s = t.states[t.states.length - 1]; return !!s && Math.abs(s.fl) < 0.1 && (s.dist ?? 0) > 2; },
      },
    ],
  },
];

export function lessonById(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}
