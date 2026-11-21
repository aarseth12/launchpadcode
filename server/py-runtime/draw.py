"""
Drawing commands for the lesson canvas. Students use it as:   from draw import *

The canvas is 300 x 300. (0, 0) is the TOP-LEFT corner; x grows to the right and y grows DOWN.

    line(x1, y1, x2, y2)        a straight line between two points
    circle(x, y, radius)        a circle around the center point (x, y)
    rect(x, y, width, height)   a rectangle; (x, y) is its top-left corner
    text(x, y, words)           words centered on (x, y)
    color("red")                pen color for everything drawn after it
    width(4)                    pen thickness
    fill("yellow") / nofill()   fill circles and rectangles in (or stop filling)
    background("skyblue")       wipe the canvas to one color
    clear()                     wipe the canvas back to white

Each command becomes one framed JSON line ({"type": "draw", "op": ...}) on the real stdout — the
same channel pyRunner.py uses for printed output — so the server forwards it to the browser as-is.
"""
import json
import math
import sys

__all__ = ["line", "circle", "rect", "text", "color", "width", "fill", "nofill", "background", "clear"]

_out = sys.__stdout__  # the real stdout (pyRunner swaps sys.stdout for its framed printer)
_shapes_left = 5000    # flood guard, like pyRunner's output cap
_pen = {"color": "black", "width": 2, "fill": None}


def _send(cmd):
    global _shapes_left
    if _shapes_left <= 0:
        return
    _shapes_left -= 1
    cmd["type"] = "draw"
    try:
        _out.write(json.dumps(cmd) + "\n")
        _out.flush()
    except Exception:
        pass
    if _shapes_left == 0:
        print("\n[drawing stopped — your program drew more than 5000 shapes]")


def _num(fn, name, value):
    """A position or size must be a plain number; say so in words a beginner can act on."""
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise TypeError(f"{fn}() needs numbers, but {name} was {value!r}")
    if not math.isfinite(value):
        raise ValueError(f"{fn}() needs a normal number for {name}, not {value!r}")
    return value


def _color(fn, value):
    if not isinstance(value, str):
        raise TypeError(f'{fn}() needs a color name in quotes, like {fn}("red"), but got {value!r}')
    return value


def line(x1, y1, x2, y2):
    _send({"op": "line",
           "x1": _num("line", "x1", x1), "y1": _num("line", "y1", y1),
           "x2": _num("line", "x2", x2), "y2": _num("line", "y2", y2),
           "color": _pen["color"], "width": _pen["width"]})


def circle(x, y, radius):
    _send({"op": "circle",
           "x": _num("circle", "x", x), "y": _num("circle", "y", y), "r": abs(_num("circle", "radius", radius)),
           "color": _pen["color"], "width": _pen["width"], "fill": _pen["fill"]})


def rect(x, y, width, height):
    _send({"op": "rect",
           "x": _num("rect", "x", x), "y": _num("rect", "y", y),
           "w": _num("rect", "width", width), "h": _num("rect", "height", height),
           "color": _pen["color"], "width": _pen["width"], "fill": _pen["fill"]})


def text(x, y, words, size=16):
    _send({"op": "text",
           "x": _num("text", "x", x), "y": _num("text", "y", y), "text": str(words),
           "size": abs(_num("text", "size", size)), "color": _pen["color"]})


def color(name):
    _pen["color"] = _color("color", name)


def width(pixels):
    _pen["width"] = abs(_num("width", "pixels", pixels))


def fill(name):
    _pen["fill"] = None if name is None else _color("fill", name)


def nofill():
    _pen["fill"] = None


def background(name):
    _send({"op": "background", "color": _color("background", name)})


def clear():
    _send({"op": "clear"})
