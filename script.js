
import { wCanvas, UMath } from "./wCanvas/wcanvas.js";
import * as utils from "./utils.js";
import { AStar } from "./AStar.js";
import * as WorldMap from "./WorldMap.js";

const CELL_SIZE = 64;

let COLS = 0;
let ROWS = 0;

let WORLD_MAP;

/** @type {utils.DebugData} */
const debugData = {
    "nodes": [],
    "colors": {
        "start": "#f00",
        "goal": "#ff0",
        "calculating": "#00f",
        "calculated": "#777",
        "path": "#0f0"
    },
    "delay": 25
};

// Used to lock path gen when one is already being generated
let lockPathGen = false;
/**
 * Generates a starting point, an end point, a WorldMap with random walls and calculates the path from start to end
 * @returns {Array<UMath.Vec2>} The path to the goal
 */
async function generatePath() {
    if (lockPathGen) { return null; }
    lockPathGen = true;

    WORLD_MAP = new WorldMap.WorldMap(0, 0, COLS, ROWS);

    const start = WORLD_MAP.pickRandomPos();
    const goal = WORLD_MAP.pickRandomPos();

    for (let i = 0; i < WORLD_MAP.size.x * WORLD_MAP.size.y / 3; i++) {
        const pos = WORLD_MAP.pickRandomPos();
        if (start.x === pos.x && start.y === pos.y || goal.x === pos.x && goal.y === pos.y) {
            continue;
        }

        WORLD_MAP.putCell(WorldMap.WALL_CELL, pos.x, pos.y);
    }

    const path = await AStar(
        start, goal,
        WORLD_MAP, debugData
    );

    lockPathGen = false;
    return path;
}

/**
 * Draws Debug Data to the canvas
 * @param {wCanvas} canvas - The canvas to draw the data on
 */
function drawDebug(canvas) {

    for (let i = 0; i < debugData.nodes.length; i++) {
        utils.drawNodePair(canvas, debugData.nodes[i], WORLD_MAP.pos.x, WORLD_MAP.pos.y, CELL_SIZE);
    }
    
    if (debugData.start && debugData.goal) {
        utils.drawNodePair(canvas, debugData.start, WORLD_MAP.pos.x, WORLD_MAP.pos.y, CELL_SIZE);
        utils.drawNodePair(canvas, debugData.goal, WORLD_MAP.pos.x, WORLD_MAP.pos.y, CELL_SIZE);
    }

    if (WORLD_MAP) {
        WORLD_MAP.draw(canvas, CELL_SIZE);
    }

}

/**
 * @param {wCanvas} canvas
 * @param {Number} deltaTime
 */
function draw(canvas, deltaTime) {
    canvas.backgroundCSS("#000");

    canvas.strokeCSS("#444");
    canvas.strokeWeigth(1);
    for (let col = 0; col <= COLS; col++) {
        canvas.line(col * CELL_SIZE, 0, col * CELL_SIZE, canvas.canvas.height);
    }

    for (let row = 0; row <= ROWS; row++) {
        canvas.line(0, row * CELL_SIZE, canvas.canvas.width, row * CELL_SIZE);
    }

    drawDebug(canvas);

    if (!lockPathGen) {
        canvas.strokeCSS("#000");
        canvas.strokeWeigth(1);
        canvas.fillCSS("#fff");
        canvas.textSize(canvas.canvas.height / 20);
        canvas.text(
            "Press R to generate a new path", canvas.canvas.width / 2, canvas.canvas.height / 2,
            { "horizontalAlignment": "center", "verticalAlignment": "center", "noStroke": false }
        );
    }
}

window.addEventListener("keydown", ev => {
    if (ev.key === "r") { generatePath(); }
});

window.addEventListener("load", () => {
    new wCanvas({
        "onDraw": draw,
        "onResize": (canvas) => {
            canvas.canvas.width = window.innerWidth + 1;
            canvas.canvas.height = window.innerHeight + 1;

            COLS = Math.floor(canvas.canvas.width / CELL_SIZE);
            ROWS = Math.floor(canvas.canvas.height / CELL_SIZE);
        }
    });
});
