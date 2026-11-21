// SVG illustrations for Lesson 0 ("How the Robot Works"). Hand-drawn, themed to the app
// palette, and self-contained (no external image files → no licensing, scales crisply,
// and the dataflow one animates with SMIL, which photos can't). Colours mirror lesson.html:
//   bg #0f1115 · panel2 #1e222b · line #2a2f3a · text #e6e9ef · muted #8b93a3
//   accent #4ea1ff · green #46d17a · red #ff5d5d · amber #f5b14c · cyan #4ed1c4

/** The three pieces of hardware, labelled side by side. */
export const HARDWARE_SVG = `<svg viewBox="0 0 720 250" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="The three pieces of FTC hardware: the gamepad controller, the Driver Station, and the Control Hub">
  <!-- ============ Controller (gamepad) ============ -->
  <g>
    <ellipse cx="78" cy="150" rx="26" ry="22" fill="#1e222b" stroke="#2a2f3a" stroke-width="2"/>
    <ellipse cx="162" cy="150" rx="26" ry="22" fill="#1e222b" stroke="#2a2f3a" stroke-width="2"/>
    <rect x="48" y="96" width="144" height="58" rx="28" fill="#1e222b" stroke="#2a2f3a" stroke-width="2"/>
    <rect x="60" y="87" width="40" height="9" rx="4" fill="#2a2f3a"/>
    <rect x="140" y="87" width="40" height="9" rx="4" fill="#2a2f3a"/>
    <!-- d-pad -->
    <rect x="73" y="113" width="10" height="26" rx="2" fill="#3a4151"/>
    <rect x="65" y="121" width="26" height="10" rx="2" fill="#3a4151"/>
    <!-- face buttons: Y B A X -->
    <circle cx="157" cy="115" r="5.5" fill="#f5b14c"/>
    <circle cx="169" cy="126" r="5.5" fill="#ff5d5d"/>
    <circle cx="157" cy="137" r="5.5" fill="#46d17a"/>
    <circle cx="145" cy="126" r="5.5" fill="#4ea1ff"/>
    <!-- thumbsticks -->
    <circle cx="103" cy="150" r="13" fill="#15181f" stroke="#2a2f3a" stroke-width="2"/>
    <circle cx="103" cy="150" r="6" fill="#4ea1ff"/>
    <circle cx="137" cy="150" r="13" fill="#15181f" stroke="#2a2f3a" stroke-width="2"/>
    <circle cx="137" cy="150" r="6" fill="#4ea1ff"/>
    <text x="120" y="208" text-anchor="middle" fill="#e6e9ef" font-family="system-ui,sans-serif" font-size="15" font-weight="600">Controller</text>
    <text x="120" y="228" text-anchor="middle" fill="#8b93a3" font-family="system-ui,sans-serif" font-size="12">the gamepad you hold</text>
  </g>

  <!-- ============ Driver Station ============ -->
  <g>
    <rect x="288" y="92" width="144" height="80" rx="12" fill="#1e222b" stroke="#2a2f3a" stroke-width="2"/>
    <rect x="298" y="101" width="124" height="62" rx="5" fill="#0b0d11"/>
    <circle cx="309" cy="114" r="3.5" fill="#46d17a"/>
    <text x="318" y="118" fill="#8b93a3" font-family="ui-monospace,monospace" font-size="9">Connected</text>
    <line x1="306" y1="127" x2="414" y2="127" stroke="#2a2f3a" stroke-width="1"/>
    <text x="306" y="142" fill="#e6e9ef" font-family="ui-monospace,monospace" font-size="9">Telemetry</text>
    <text x="306" y="155" fill="#4ea1ff" font-family="ui-monospace,monospace" font-size="9">status: Hello!</text>
    <text x="360" y="208" text-anchor="middle" fill="#e6e9ef" font-family="system-ui,sans-serif" font-size="15" font-weight="600">Driver Station</text>
    <text x="360" y="228" text-anchor="middle" fill="#8b93a3" font-family="system-ui,sans-serif" font-size="12">a phone or Driver Hub</text>
  </g>

  <!-- ============ Control Hub ============ -->
  <g>
    <rect x="520" y="86" width="160" height="92" rx="8" fill="#14171d" stroke="#4ea1ff" stroke-width="2"/>
    <text x="600" y="105" text-anchor="middle" fill="#4ea1ff" font-family="system-ui,sans-serif" font-size="10" font-weight="700" letter-spacing="1">REV CONTROL HUB</text>
    <text x="533" y="126" fill="#8b93a3" font-family="ui-monospace,monospace" font-size="7.5">MOTORS</text>
    <rect x="533" y="130" width="20" height="14" rx="2" fill="#46d17a"/>
    <rect x="557" y="130" width="20" height="14" rx="2" fill="#2a2f3a"/>
    <rect x="581" y="130" width="20" height="14" rx="2" fill="#46d17a"/>
    <rect x="605" y="130" width="20" height="14" rx="2" fill="#2a2f3a"/>
    <text x="533" y="159" fill="#8b93a3" font-family="ui-monospace,monospace" font-size="7.5">SENSORS</text>
    <rect x="533" y="162" width="13" height="12" rx="2" fill="#4ed1c4"/>
    <rect x="550" y="162" width="13" height="12" rx="2" fill="#f5b14c"/>
    <rect x="567" y="162" width="13" height="12" rx="2" fill="#ff5d5d"/>
    <rect x="584" y="162" width="13" height="12" rx="2" fill="#4ea1ff"/>
    <rect x="636" y="160" width="32" height="13" rx="2" fill="#2a2f3a"/>
    <text x="652" y="169" text-anchor="middle" fill="#8b93a3" font-family="ui-monospace,monospace" font-size="7">USB</text>
    <text x="600" y="208" text-anchor="middle" fill="#e6e9ef" font-family="system-ui,sans-serif" font-size="15" font-weight="600">Control Hub</text>
    <text x="600" y="228" text-anchor="middle" fill="#8b93a3" font-family="system-ui,sans-serif" font-size="12">runs all your code</text>
  </g>
</svg>`;

/** The dataflow, animated: a button press travels controller → Driver Station → Wi-Fi → Control Hub → motors & sensors. */
export const DATAFLOW_SVG = `<svg viewBox="0 0 720 250" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Animated diagram: a button press flows from the controller to the Driver Station, wirelessly over Wi-Fi to the Control Hub, then out through ports to the motors and sensors">
  <!-- ===== static connections (drawn first, behind everything) ===== -->
  <line x1="100" y1="150" x2="206" y2="150" stroke="#2a2f3a" stroke-width="2"/>
  <line x1="477" y1="150" x2="620" y2="105" stroke="#2a2f3a" stroke-width="2"/>
  <line x1="477" y1="150" x2="620" y2="150" stroke="#2a2f3a" stroke-width="2"/>
  <line x1="477" y1="150" x2="620" y2="195" stroke="#2a2f3a" stroke-width="2"/>

  <!-- ===== connection labels ===== -->
  <text x="153" y="135" text-anchor="middle" fill="#8b93a3" font-family="ui-monospace,monospace" font-size="10">USB cable</text>
  <text x="326" y="110" text-anchor="middle" fill="#8b93a3" font-family="ui-monospace,monospace" font-size="10">Wi-Fi</text>
  <text x="556" y="112" text-anchor="middle" fill="#8b93a3" font-family="ui-monospace,monospace" font-size="10">ports</text>

  <!-- ===== sequential highlight halos ===== -->
  <rect x="34" y="112" width="72" height="76" rx="12" fill="none" stroke="#4ea1ff" stroke-width="3" opacity="0">
    <animate attributeName="opacity" dur="4.8s" repeatCount="indefinite" keyTimes="0;0.01;0.20;0.24;1" values="0;0.9;0.9;0;0"/>
  </rect>
  <rect x="201" y="112" width="68" height="76" rx="12" fill="none" stroke="#4ea1ff" stroke-width="3" opacity="0">
    <animate attributeName="opacity" dur="4.8s" repeatCount="indefinite" keyTimes="0;0.25;0.26;0.45;0.49;1" values="0;0;0.9;0.9;0;0"/>
  </rect>
  <rect x="380" y="113" width="102" height="74" rx="12" fill="none" stroke="#4ea1ff" stroke-width="3" opacity="0">
    <animate attributeName="opacity" dur="4.8s" repeatCount="indefinite" keyTimes="0;0.50;0.51;0.70;0.74;1" values="0;0;0.9;0.9;0;0"/>
  </rect>
  <rect x="610" y="82" width="84" height="134" rx="12" fill="none" stroke="#4ea1ff" stroke-width="3" opacity="0">
    <animate attributeName="opacity" dur="4.8s" repeatCount="indefinite" keyTimes="0;0.75;0.76;0.96;0.99;1" values="0;0;0.9;0.9;0;0"/>
  </rect>

  <!-- ===== mini controller ===== -->
  <g>
    <rect x="42" y="135" width="56" height="30" rx="15" fill="#1e222b" stroke="#2a2f3a" stroke-width="2"/>
    <rect x="50" y="129" width="14" height="5" rx="2" fill="#2a2f3a"/>
    <rect x="76" y="129" width="14" height="5" rx="2" fill="#2a2f3a"/>
    <circle cx="58" cy="150" r="5" fill="#4ea1ff"/>
    <circle cx="82" cy="150" r="5" fill="#4ea1ff"/>
    <text x="70" y="205" text-anchor="middle" fill="#e6e9ef" font-family="system-ui,sans-serif" font-size="12" font-weight="600">Controller</text>
    <text x="70" y="221" text-anchor="middle" fill="#8b93a3" font-family="system-ui,sans-serif" font-size="10">you press a button</text>
  </g>

  <!-- ===== mini Driver Station ===== -->
  <g>
    <rect x="207" y="126" width="56" height="48" rx="7" fill="#1e222b" stroke="#2a2f3a" stroke-width="2"/>
    <rect x="213" y="132" width="44" height="36" rx="3" fill="#0b0d11"/>
    <circle cx="221" cy="141" r="2.5" fill="#46d17a"/>
    <text x="227" y="144" fill="#8b93a3" font-family="ui-monospace,monospace" font-size="6">live</text>
    <line x1="217" y1="150" x2="253" y2="150" stroke="#2a2f3a" stroke-width="1"/>
    <text x="217" y="161" fill="#4ea1ff" font-family="ui-monospace,monospace" font-size="6.5">Hello!</text>
    <text x="235" y="205" text-anchor="middle" fill="#e6e9ef" font-family="system-ui,sans-serif" font-size="12" font-weight="600">Driver Station</text>
    <text x="235" y="221" text-anchor="middle" fill="#8b93a3" font-family="system-ui,sans-serif" font-size="10">relays it onward</text>
  </g>

  <!-- ===== mini Control Hub ===== -->
  <g>
    <rect x="385" y="118" width="92" height="64" rx="7" fill="#14171d" stroke="#4ea1ff" stroke-width="2"/>
    <text x="431" y="133" text-anchor="middle" fill="#4ea1ff" font-family="system-ui,sans-serif" font-size="7.5" font-weight="700" letter-spacing="0.5">CONTROL HUB</text>
    <rect x="396" y="140" width="14" height="9" rx="1.5" fill="#46d17a"/>
    <rect x="414" y="140" width="14" height="9" rx="1.5" fill="#2a2f3a"/>
    <rect x="432" y="140" width="14" height="9" rx="1.5" fill="#46d17a"/>
    <rect x="450" y="140" width="14" height="9" rx="1.5" fill="#2a2f3a"/>
    <rect x="396" y="157" width="10" height="9" rx="1.5" fill="#4ed1c4"/>
    <rect x="410" y="157" width="10" height="9" rx="1.5" fill="#f5b14c"/>
    <rect x="424" y="157" width="10" height="9" rx="1.5" fill="#ff5d5d"/>
    <rect x="438" y="157" width="10" height="9" rx="1.5" fill="#4ea1ff"/>
    <text x="431" y="205" text-anchor="middle" fill="#e6e9ef" font-family="system-ui,sans-serif" font-size="12" font-weight="600">Control Hub</text>
    <text x="431" y="221" text-anchor="middle" fill="#8b93a3" font-family="system-ui,sans-serif" font-size="10">runs your code</text>
  </g>

  <!-- ===== devices (motors & sensors) ===== -->
  <g>
    <circle cx="640" cy="105" r="18" fill="#1e222b" stroke="#2a2f3a" stroke-width="2"/>
    <text x="640" y="111" text-anchor="middle" fill="#46d17a" font-family="system-ui,sans-serif" font-size="15" font-weight="700">M</text>
    <rect x="624" y="138" width="32" height="24" rx="4" fill="#1e222b" stroke="#2a2f3a" stroke-width="2"/>
    <circle cx="640" cy="150" r="6" fill="#4ed1c4"/>
    <rect x="624" y="183" width="32" height="24" rx="4" fill="#1e222b" stroke="#2a2f3a" stroke-width="2"/>
    <circle cx="633" cy="195" r="4" fill="#4ea1ff"/>
    <circle cx="647" cy="195" r="4" fill="#4ea1ff"/>
    <text x="640" y="232" text-anchor="middle" fill="#e6e9ef" font-family="system-ui,sans-serif" font-size="12" font-weight="600">motors &amp; sensors</text>
  </g>

  <!-- ===== Wi-Fi waves (beam out during stage 2) ===== -->
  <g fill="none" stroke="#4ea1ff" stroke-width="3" stroke-linecap="round">
    <path d="M 296,137 Q 310,150 296,163" opacity="0">
      <animate attributeName="opacity" dur="4.8s" repeatCount="indefinite" keyTimes="0;0.26;0.28;0.47;0.49;1" values="0;0;1;1;0;0"/>
    </path>
    <path d="M 313,129 Q 333,150 313,171" opacity="0">
      <animate attributeName="opacity" dur="4.8s" repeatCount="indefinite" keyTimes="0;0.31;0.33;0.47;0.49;1" values="0;0;1;1;0;0"/>
    </path>
    <path d="M 330,121 Q 356,150 330,179" opacity="0">
      <animate attributeName="opacity" dur="4.8s" repeatCount="indefinite" keyTimes="0;0.37;0.39;0.47;0.49;1" values="0;0;1;1;0;0"/>
    </path>
  </g>

  <!-- ===== stage 1: pulse travels the USB cable (controller → Driver Station) ===== -->
  <circle cy="150" r="5.5" fill="#4ea1ff" opacity="0">
    <animate attributeName="cx" dur="4.8s" repeatCount="indefinite" keyTimes="0;0.20;1" values="100;206;206"/>
    <animate attributeName="opacity" dur="4.8s" repeatCount="indefinite" keyTimes="0;0.02;0.18;0.21;1" values="0;1;1;0;0"/>
  </circle>

  <!-- ===== stage 3: pulses travel the ports (Control Hub → motors & sensors) ===== -->
  <circle r="4.5" fill="#46d17a" opacity="0">
    <animateMotion dur="4.8s" repeatCount="indefinite" calcMode="linear" keyTimes="0;0.50;0.70;1" keyPoints="0;0;1;1" path="M 477,150 L 618,106"/>
    <animate attributeName="opacity" dur="4.8s" repeatCount="indefinite" keyTimes="0;0.50;0.52;0.68;0.70;1" values="0;0;1;1;0;0"/>
  </circle>
  <circle r="4.5" fill="#4ed1c4" opacity="0">
    <animateMotion dur="4.8s" repeatCount="indefinite" calcMode="linear" keyTimes="0;0.50;0.70;1" keyPoints="0;0;1;1" path="M 477,150 L 618,150"/>
    <animate attributeName="opacity" dur="4.8s" repeatCount="indefinite" keyTimes="0;0.53;0.55;0.68;0.70;1" values="0;0;1;1;0;0"/>
  </circle>
  <circle r="4.5" fill="#4ea1ff" opacity="0">
    <animateMotion dur="4.8s" repeatCount="indefinite" calcMode="linear" keyTimes="0;0.50;0.70;1" keyPoints="0;0;1;1" path="M 477,150 L 618,194"/>
    <animate attributeName="opacity" dur="4.8s" repeatCount="indefinite" keyTimes="0;0.56;0.58;0.68;0.70;1" values="0;0;1;1;0;0"/>
  </circle>
</svg>`;

/** The OpMode lifecycle: one-time setup feeds into the Read -> Decide -> Act loop, which repeats fast. */
export const LOOP_SVG = `<svg viewBox="0 0 720 285" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="The OpMode cycle: after a one-time setup and waitForStart, the control loop repeats Read inputs, Decide, Act (set motors) many times a second until the OpMode is stopped">
  <defs>
    <marker id="lh" markerWidth="9" markerHeight="9" refX="7.5" refY="4.5" orient="auto" markerUnits="userSpaceOnUse"><path d="M0,0 L9,4.5 L0,9 z" fill="#4ea1ff"/></marker>
    <marker id="lhm" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto" markerUnits="userSpaceOnUse"><path d="M0,0 L8,4 L0,8 z" fill="#8b93a3"/></marker>
    <filter id="loopglow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>

  <!-- one-time setup -->
  <rect x="130" y="44" width="172" height="40" rx="8" fill="#171a21" stroke="#2a2f3a" stroke-width="1.5"/>
  <text x="216" y="61" text-anchor="middle" fill="#e6e9ef" font-family="system-ui,sans-serif" font-size="11.5" font-weight="600">Setup — runs once</text>
  <text x="216" y="75" text-anchor="middle" fill="#8b93a3" font-family="ui-monospace,monospace" font-size="9.5">grab motors, waitForStart()</text>
  <line x1="216" y1="85" x2="216" y2="108" stroke="#8b93a3" stroke-width="2" marker-end="url(#lhm)"/>

  <!-- exit when stopped -->
  <text x="590" y="57" text-anchor="middle" fill="#8b93a3" font-family="system-ui,sans-serif" font-size="10">exit when you</text>
  <text x="590" y="70" text-anchor="middle" fill="#8b93a3" font-family="system-ui,sans-serif" font-size="10">press STOP</text>
  <path d="M 640,150 Q 620,104 600,79" fill="none" stroke="#8b93a3" stroke-width="1.5" stroke-dasharray="3 3" marker-end="url(#lhm)"/>

  <!-- step 1: Read -->
  <rect x="150" y="112" width="130" height="56" rx="10" fill="#1e222b" stroke="#4ea1ff" stroke-width="2"/>
  <circle cx="170" cy="140" r="11" fill="#4ea1ff"/>
  <text x="170" y="144" text-anchor="middle" fill="#0b0d11" font-family="system-ui,sans-serif" font-size="12" font-weight="700">1</text>
  <text x="189" y="136" fill="#e6e9ef" font-family="system-ui,sans-serif" font-size="13" font-weight="600">Read</text>
  <text x="189" y="152" fill="#8b93a3" font-family="system-ui,sans-serif" font-size="9.5">gamepad/sensors</text>

  <!-- step 2: Decide -->
  <rect x="305" y="112" width="130" height="56" rx="10" fill="#1e222b" stroke="#f5b14c" stroke-width="2"/>
  <circle cx="325" cy="140" r="11" fill="#f5b14c"/>
  <text x="325" y="144" text-anchor="middle" fill="#0b0d11" font-family="system-ui,sans-serif" font-size="12" font-weight="700">2</text>
  <text x="344" y="136" fill="#e6e9ef" font-family="system-ui,sans-serif" font-size="13" font-weight="600">Decide</text>
  <text x="344" y="152" fill="#8b93a3" font-family="system-ui,sans-serif" font-size="9.5">your logic</text>

  <!-- step 3: Act -->
  <rect x="460" y="112" width="130" height="56" rx="10" fill="#1e222b" stroke="#46d17a" stroke-width="2"/>
  <circle cx="480" cy="140" r="11" fill="#46d17a"/>
  <text x="480" y="144" text-anchor="middle" fill="#0b0d11" font-family="system-ui,sans-serif" font-size="12" font-weight="700">3</text>
  <text x="499" y="136" fill="#e6e9ef" font-family="system-ui,sans-serif" font-size="13" font-weight="600">Act</text>
  <text x="499" y="152" fill="#8b93a3" font-family="system-ui,sans-serif" font-size="9.5">set motors</text>

  <!-- arrows between steps -->
  <line x1="282" y1="140" x2="301" y2="140" stroke="#4ea1ff" stroke-width="2.5" marker-end="url(#lh)"/>
  <line x1="437" y1="140" x2="456" y2="140" stroke="#4ea1ff" stroke-width="2.5" marker-end="url(#lh)"/>

  <!-- loop-back / return arrow -->
  <path d="M 590,140 H 622 Q 640,140 640,158 V 222 Q 640,240 622,240 H 140 Q 122,240 122,222 V 158 Q 122,140 140,140 H 147" fill="none" stroke="#4ea1ff" stroke-width="2.5" marker-end="url(#lh)"/>

  <!-- center + repeat labels -->
  <text x="381" y="200" text-anchor="middle" fill="#cdd3df" font-family="ui-monospace,monospace" font-size="12.5">while (opModeIsActive())</text>
  <text x="381" y="259" text-anchor="middle" fill="#4ea1ff" font-family="system-ui,sans-serif" font-size="11">&#8635; the loop repeats — many times a second (every few ms)</text>

  <!-- a single pulse circling the loop — ONE dot, because the control loop is single-threaded -->
  <circle r="6" fill="#dcebff" filter="url(#loopglow)">
    <animateMotion dur="3s" repeatCount="indefinite" calcMode="linear" path="M 150,140 H 622 Q 640,140 640,158 V 222 Q 640,240 622,240 H 140 Q 122,240 122,222 V 158 Q 122,140 140,140 H 150"/>
  </circle>
</svg>`;

// ---- Mecanum "how it works" diagram ----------------------------------------------
// Three top-down panels — drive forward, strafe right, turn — that connect the mixing
// formula to what the robot actually does: a driver input (axial / lateral / yaw) sets
// each wheel's spin (the formula's +/- pattern, which is ALSO the wheel's colour in the
// sim), the 45° rollers redirect that spin into a force, and the four forces add up to
// the robot's motion. The per-wheel signs and the strafe/turn directions are taken
// straight from MecanumChassis.java (vStrafe +1 = right, omega +1 = clockwise), so the
// picture matches the simulator the student is about to drive.
//
// Roller orientation (as drawn from the top) is the standard cross-to-center X: every wheel's
// diagonal points at the robot's center — FL & BR are "\", FR & BL are "/". That's how real
// mecanum wheels are conventionally drawn. The substantive correctness lives in the wheel-spin
// arrows, their green/red colours, and the motion arrows, which all match MecanumChassis.java.

const W_FWD = "#46d17a", W_BACK = "#ff5d5d", MOVE = "#4ed1c4";

/** Parallel 45° roller lines, clipped to the wheel rect (#wclip). slash=true draws "/", else "\". */
function rollers(slash: boolean): string {
  const seg: string[] = [];
  for (let c = -21; c <= 21; c += 7) {
    const [x1, y1, x2, y2] = slash ? [c - 14, 14, c + 14, -14] : [c - 14, -14, c + 14, 14];
    seg.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#6b7384" stroke-width="1.5"/>`);
  }
  return `<g clip-path="url(#wclip)">${seg.join("")}</g>`;
}

/** One wheel: rect + rollers + a spin arrow (up=forward green, down=backward red) + its power value. */
function mWheel(wx: number, wy: number, slash: boolean, roll: number, side: "L" | "R"): string {
  const fwd = roll > 0;
  const col = fwd ? W_FWD : W_BACK;
  const mk = fwd ? "url(#sg)" : "url(#sr)";
  const y1 = fwd ? 11 : -11, y2 = fwd ? -11 : 11; // arrowhead sits at y2
  const val = fwd ? "+1.0" : "−1.0";
  const lx = side === "L" ? -15 : 15;
  const anc = side === "L" ? "end" : "start";
  return `<g transform="translate(${wx},${wy})">
    <rect x="-10" y="-16" width="20" height="32" rx="3" fill="#15181f" stroke="#3a4151" stroke-width="1.5"/>
    ${rollers(slash)}
    <line x1="0" y1="${y1}" x2="0" y2="${y2}" stroke="#0b0d11" stroke-width="6" stroke-linecap="round"/>
    <line x1="0" y1="${y1}" x2="0" y2="${y2}" stroke="${col}" stroke-width="3" stroke-linecap="round" marker-end="${mk}"/>
    <text x="${lx}" y="3.5" text-anchor="${anc}" fill="${col}" font-family="ui-monospace,monospace" font-size="9" font-weight="700">${val}</text>
  </g>`;
}

/** The big arrow showing where the whole robot goes for this panel. */
function mMove(key: string, cx: number): string {
  const base = `stroke="${MOVE}" stroke-width="5" stroke-linecap="round" marker-end="url(#mv)" filter="url(#mglow)"`;
  if (key === "forward") return `<line x1="${cx}" y1="201" x2="${cx}" y2="139" ${base}/>`;
  if (key === "strafe") return `<line x1="${cx - 30}" y1="170" x2="${cx + 55}" y2="170" ${base}/>`;
  return `<path d="M ${cx + 33},170 A 33,33 0 1 1 ${cx},137" fill="none" ${base}/>`; // turn: 270° clockwise, arrowhead at top pointing right
}

interface MecaPanel { cx: number; key: string; title: string; a: string; l: string; y: string; cap: string; rolls: { fl: number; fr: number; bl: number; br: number }; }

const MECA_PANELS: MecaPanel[] = [
  { cx: 120, key: "forward", title: "Drive forward", a: "1.0", l: "0", y: "0", cap: "Drives forward", rolls: { fl: 1, fr: 1, bl: 1, br: 1 } },
  { cx: 360, key: "strafe", title: "Strafe right", a: "0", l: "1.0", y: "0", cap: "Strafes right", rolls: { fl: 1, fr: -1, bl: -1, br: 1 } },
  { cx: 600, key: "turn", title: "Turn right", a: "0", l: "0", y: "1.0", cap: "Turns clockwise", rolls: { fl: 1, fr: -1, bl: 1, br: -1 } },
];

/** One small-multiple: title, the three input values, the robot with four wheels, and the motion arrow. */
function mPanel(p: MecaPanel): string {
  const cx = p.cx;
  const inChip = (label: string, v: string) => {
    const on = v !== "0";
    return `<tspan fill="${on ? "#e6e9ef" : "#8b93a3"}" font-weight="${on ? "700" : "400"}">${label} ${v}</tspan>`;
  };
  return `<text x="${cx}" y="26" text-anchor="middle" fill="#e6e9ef" font-family="system-ui,sans-serif" font-size="13" font-weight="600">${p.title}</text>
    <text x="${cx}" y="45" text-anchor="middle" font-family="ui-monospace,monospace" font-size="9.5">${inChip("axial", p.a)}<tspan fill="#5a6172">  ·  </tspan>${inChip("lateral", p.l)}<tspan fill="#5a6172">  ·  </tspan>${inChip("yaw", p.y)}</text>
    <rect x="${cx - 43}" y="120" width="86" height="100" rx="11" fill="#1e222b" stroke="#2a2f3a" stroke-width="1.6"/>
    <path d="M ${cx - 8},128 L ${cx},121 L ${cx + 8},128" fill="none" stroke="#8b93a3" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    ${mWheel(cx - 43, 145, false, p.rolls.fl, "L")}${mWheel(cx + 43, 145, true, p.rolls.fr, "R")}${mWheel(cx - 43, 195, true, p.rolls.bl, "L")}${mWheel(cx + 43, 195, false, p.rolls.br, "R")}
    ${mMove(p.key, cx)}
    <text x="${cx}" y="247" text-anchor="middle" fill="${MOVE}" font-family="system-ui,sans-serif" font-size="11.5" font-weight="700">${p.cap}</text>`;
}

/** A driver-input → wheel-spins → robot-motion explainer for the Mecanum Drive lesson. */
export const MECANUM_SVG = `<svg viewBox="0 0 720 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Three top-down views of the robot showing how the mixing formula drives it. Driving forward spins all four wheels forward and the robot moves forward. Strafing right spins the front-left and back-right wheels forward and the front-right and back-left backward, and the robot slides to the right. Turning spins the left wheels forward and the right wheels backward, and the robot rotates clockwise. Each wheel is drawn with diagonal lines for its 45-degree rollers.">
  <defs>
    <clipPath id="wclip"><rect x="-10" y="-16" width="20" height="32" rx="3"/></clipPath>
    <marker id="sg" viewBox="0 -5 9 10" markerWidth="9" markerHeight="10" refX="8" refY="0" orient="auto" markerUnits="userSpaceOnUse"><path d="M0,-4 L8,0 L0,4 Z" fill="#46d17a"/></marker>
    <marker id="sr" viewBox="0 -5 9 10" markerWidth="9" markerHeight="10" refX="8" refY="0" orient="auto" markerUnits="userSpaceOnUse"><path d="M0,-4 L8,0 L0,4 Z" fill="#ff5d5d"/></marker>
    <marker id="mv" viewBox="0 -8 16 16" markerWidth="16" markerHeight="16" refX="13" refY="0" orient="auto" markerUnits="userSpaceOnUse"><path d="M0,-8 L14,0 L0,8 Z" fill="#4ed1c4"/></marker>
    <!-- userSpaceOnUse + explicit region: a straight (vertical/horizontal) arrow has a zero-area
         objectBoundingBox, which would collapse the filter and make the line vanish. -->
    <filter id="mglow" filterUnits="userSpaceOnUse" x="0" y="0" width="720" height="320"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>

  ${MECA_PANELS.map(mPanel).join("\n  ")}

  <!-- panel dividers -->
  <line x1="240" y1="14" x2="240" y2="256" stroke="#2a2f3a" stroke-width="1"/>
  <line x1="480" y1="14" x2="480" y2="256" stroke="#2a2f3a" stroke-width="1"/>

  <!-- legend -->
  <line x1="24" y1="268" x2="696" y2="268" stroke="#2a2f3a" stroke-width="1"/>
  <line x1="52" y1="299" x2="52" y2="285" stroke="#46d17a" stroke-width="3" stroke-linecap="round" marker-end="url(#sg)"/>
  <text x="64" y="296" fill="#8b93a3" font-family="system-ui,sans-serif" font-size="10">spins forward</text>
  <line x1="250" y1="285" x2="250" y2="299" stroke="#ff5d5d" stroke-width="3" stroke-linecap="round" marker-end="url(#sr)"/>
  <text x="262" y="296" fill="#8b93a3" font-family="system-ui,sans-serif" font-size="10">spins backward</text>
  <line x1="452" y1="292" x2="476" y2="292" stroke="#4ed1c4" stroke-width="3" stroke-linecap="round" marker-end="url(#mv)"/>
  <text x="486" y="296" fill="#8b93a3" font-family="system-ui,sans-serif" font-size="10">robot moves</text>
  <g transform="translate(605,291)"><rect x="-7" y="-11" width="14" height="22" rx="2" fill="#15181f" stroke="#3a4151" stroke-width="1.2"/><g clip-path="url(#wclipL)"><line x1="-13" y1="9" x2="1" y2="-5" stroke="#6b7384" stroke-width="1.4"/><line x1="-7" y1="11" x2="7" y2="-3" stroke="#6b7384" stroke-width="1.4"/><line x1="-1" y1="13" x2="13" y2="-1" stroke="#6b7384" stroke-width="1.4"/></g></g>
  <text x="619" y="296" fill="#8b93a3" font-family="system-ui,sans-serif" font-size="10">= rollers</text>
  <clipPath id="wclipL"><rect x="-7" y="-11" width="14" height="22" rx="2"/></clipPath>
</svg>`;
