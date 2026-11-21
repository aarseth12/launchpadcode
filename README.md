# Launchpad Code

A self-hosted coding classroom for middle- and high-school students. Students work through
step-by-step lessons in the browser and write **real code that really runs**. An AI coach
(Claude Haiku) gives hints and answers questions without handing out the answer.

It was built for a weekly robotics/coding class run from a teacher's laptop: the laptop runs the
server, and students connect over the classroom Wi-Fi with nothing to install.

## What's inside

- **Python course (16 lessons):** from `print("hello")` through variables, loops, functions and
  lists, up to games: a cipher, Hangman, drawing on a canvas, and a playable Tic-Tac-Toe.
- **FTC Java course:** students write FTC-style robot code (`LinearOpMode`, motors, servos,
  sensors). It compiles with `javac` against a mock of the FTC SDK and drives a simulated
  mecanum robot in the browser.
- **Walkthroughs before each project:**
  - short reading steps, worked examples and diagrams
  - runnable "try it" snippets
  - small exercises
  - type-it-out drills (paste is blocked, so students type the key lines)
  - a quiz
- **Projects** are graded automatically and deterministically. For example, Tic-Tac-Toe is checked
  by playing several scripted games against the student's program.
- **AI coach:** an "Ask" panel plus hints on wrong drill answers, with per-student rate limits.
  If no API key is set, everything else still works and drills fall back to built-in hints.
- **Sandboxed:** every student gets their own throwaway Docker container with networking turned off.

## How it works

```
browser (student)  ──HTTP + WebSocket──▶  Node server (server/src/server.ts, port 8090)
                                            ├─ serves the pages in web/
                                            ├─ runs/grades Python in a per-student Docker container
                                            ├─ compiles FTC Java with javac, runs it in Docker
                                            ├─ saves students and their code in SQLite (server/data/app.db)
                                            └─ calls the Anthropic API for the AI coach
```

- **No database server.** Student names, project code and tutor chats live in one SQLite file,
  `server/data/app.db`, created on first run (SQLite is built into Node 24).
- **Login** is "type your name": there are no passwords. Only run it on a network you trust,
  like a classroom Wi-Fi.

## Requirements

- **Node.js 24+.** The server is TypeScript run directly by Node; there's no build step.
- **Docker** (Docker Desktop on Mac/Windows), running.
- **A JDK 17+ (`javac`)**: only for the FTC Java course.
- **An Anthropic API key**: optional; it's only needed for the AI coach.

## Run it locally

```bash
git clone https://github.com/aarseth12/launchpadcode.git
cd launchpadcode/server
npm install

# Optional but recommended: download the sandbox images now, so the first student isn't kept waiting
docker pull python:3-slim
docker pull eclipse-temurin:17-jre

npm start
```

Open **http://localhost:8090**.

Students on the same network use `http://<this-computer's-IP>:8090`. On a Mac, find the IP with
`ipconfig getifaddr en0`.

Stop the server with `Ctrl+C`.

## Setting the Anthropic API key

The AI coach needs an [Anthropic API key](https://console.anthropic.com/settings/keys). Either way
below works.

**Option 1: a `.env` file (recommended).** Copy the example and put your key in it:

```bash
cd server
cp .env.example .env
# then edit server/.env:
#   ANTHROPIC_API_KEY=sk-ant-...
```

The server reads `server/.env` every time it starts. The file is in `.gitignore`, so the key is
never committed.

**Option 2: an environment variable.** It takes priority over `.env`:

```bash
ANTHROPIC_API_KEY=sk-ant-... npm start
```

Without a key, the lessons, Run and Check all work; the Ask panel just says the tutor isn't set up.

### Other settings (optional)

These can go in `server/.env` too:

| Variable | Default | What it does |
|---|---|---|
| `ANTHROPIC_API_KEY` | none | Turns on the AI coach and drill hints |
| `FTC_PY_IMAGE` | `python:3-slim` | Docker image that runs Python lessons |
| `FTC_SANDBOX_IMAGE` | `eclipse-temurin:17-jre` | Docker image that runs FTC Java |
| `FTC_SANDBOX` | `docker` | Set to `none` to run code without Docker. **Local development only**: student code then runs directly on your computer. |

## Student data and backups

Everything students do is saved in `server/data/app.db`. It is **not** in git (see `.gitignore`).
To back it up, stop the server and copy that file. To restore, put the file back.

## Project layout

```
web/                 the pages students see (home, lessons, console, FTC sim)
server/src/          the Node server
  server.ts          HTTP + WebSocket server, routes
  courses/python.ts  Python lessons, walkthroughs and grading checks
  courses/ftc.ts     FTC Java lessons
  pySandbox.ts       per-student Python containers
  ftcSandbox.ts      javac + robot sim runner
  tutor.ts           AI coach (Anthropic API)
  db.ts              SQLite storage
server/py-runtime/   runs inside the Python container (output framing, drawing library)
server/ftc-mock/     mock FTC SDK + simulated robot hardware
poc/                 early proof-of-concept of the robot sim
```

## Adding a lesson

Python lessons are plain objects in `server/src/courses/python.ts`: a title, instructions, starter
code, walkthrough steps, and `expect` checks that grade the project's output (including scripted
`input()` answers and canvas drawings). Add a new lesson object to the `LESSONS` list at the bottom
of the file and restart the server.
