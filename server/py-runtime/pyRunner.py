"""
Runs a student's Python program and frames its output as JSON lines on the real stdout, so the
Node server can forward them over the WebSocket exactly like the FTC sim worker's state lines.
Every emitted line is one JSON object starting with "{" — matching the server's line filter.

The program comes from a FILE (written into the container's /tmp), which leaves the process's real
stdin FREE for the student's own input() calls — the server feeds typed lines to that stdin.

Emits:
  {"type":"started"}
  {"type":"stdout","text": "..."}   # a chunk the program printed (input() prompts land here too)
  {"type":"stderr","text": "..."}
  {"type":"runtimeError","message":"<traceback>"}
  {"type":"timeout","message":"..."}
  {"type":"exit","code": <int>}
  {"type":"draw","op": ...}          # a shape from `from draw import *` (written by draw.py, next to this file)

Usage: python pyRunner.py <script.py|-> [timeout_seconds]   ( - = read the program from stdin )
"""
import sys
import os
import json
import signal
import runpy
import builtins
import traceback

_real = sys.stdout  # keep the true stdout before we redirect the student's
_frames_left = 5000  # flood guard: stop echoing after this many output chunks


def emit(obj):
    try:
        _real.write(json.dumps(obj) + "\n")
        _real.flush()
    except Exception:
        pass


class Framed:
    """A stdout/stderr stand-in: every write becomes one framed JSON line (up to the flood cap)."""
    def __init__(self, kind):
        self.kind = kind  # "stdout" | "stderr"

    def write(self, s):
        global _frames_left
        if not s:
            return 0
        if _frames_left > 0:
            _frames_left -= 1
            emit({"type": self.kind, "text": s})
            if _frames_left == 0:
                emit({"type": "stdout", "text": "\n[output stopped — your program printed too much]\n"})
        return len(s)

    def flush(self):
        pass

    def isatty(self):
        return False


def _on_timeout(signum, frame):
    emit({"type": "timeout", "message": "Your program was waiting or running too long and was stopped."})
    os._exit(0)


def main():
    script = sys.argv[1] if len(sys.argv) > 1 else "main.py"
    timeout = int(sys.argv[2]) if len(sys.argv) > 2 else 60

    # `-` still means read the whole program from stdin (used when there's no input()).
    src = sys.stdin.read() if script == "-" else None

    try:
        signal.signal(signal.SIGALRM, _on_timeout)
        signal.alarm(timeout)
    except Exception:
        pass

    # Give the student fresh time to type at EACH input() prompt (reset the wall-clock cap on each
    # call), while a runaway loop with no input() still hits the alarm and is stopped.
    _real_input = builtins.input

    def _timed_input(prompt=""):
        try:
            signal.alarm(timeout)
        except Exception:
            pass
        return _real_input(prompt)
    builtins.input = _timed_input

    emit({"type": "started"})
    sys.stdout = Framed("stdout")
    sys.stderr = Framed("stderr")

    code = 0
    try:
        if src is not None:
            exec(compile(src, "main.py", "exec"), {"__name__": "__main__"})
        else:
            runpy.run_path(script, run_name="__main__")
    except SystemExit as e:
        code = e.code if isinstance(e.code, int) else 0
    except EOFError:
        # "eof" lets the grader tell "ran out of typed answers" apart from a real crash.
        emit({"type": "runtimeError", "eof": True, "message": "Your program asked for input but none was given. (Did you press Run without typing an answer?)"})
        code = 1
    except BaseException:
        emit({"type": "runtimeError", "message": traceback.format_exc()})
        code = 1
    finally:
        sys.stdout = _real
        emit({"type": "exit", "code": code})


if __name__ == "__main__":
    main()
