
import { wCanvas, UMath } from "./wCanvas/wcanvas.js";
import * as utils from "./utils.js";
import { AStar } from "./AStar.js";

const CELL_SIZE = 64;

let COLS = 0;
let ROWS = 0;

/** @type {utils.DebugData} */
const debugData = {
    "nodes": [],
    "colors": {
        "start": "#f00",
        "goal": "#ff0",
        "calculating": "#00f",
        "calculated": "#777",
        "path": "#0f0",
        "obstacles": "#fff"
    },
    "delay": 25
};

/**
 * Generates a new Vector inside of the grid
 * @param {Number} offset - Width and height offset
 * @returns {UMath.Vec2} A new Vector inside of the grid
 */
function getRandomPos(offset = 0) {
    return new UMath.Vec2(Math.round(Math.random() * (COLS + offset)), Math.round(Math.random() * (ROWS + offset)));
}

/**
 * Creates an hollow rectangle of obstacles
 * @param {utils.Obstacles} obstacles - The obstacles map
 * @param {Number} x - The x pos at which to draw the rectangle
 * @param {Number} y - The y pos at which to draw the rectangle
 * @param {Number} w - The width of the rectangle
 * @param {Number} h - The height of the rectangle
 */
function addHollowRect(obstacles, x, y, w, h) {
    for (let relX = 0; relX < w; relX++) {
        if (!obstacles.has(relX + x)) { obstacles.set(relX + x, new Map()); }

        if (relX === 0 || relX === w - 1) {
            for (let relY = 0; relY < h; relY++) {
                obstacles.get(relX + x).set(relY + y, true);
            }
        }
        obstacles.get(relX + x).set(y, true);
        obstacles.get(relX + x).set(y + h, true);
    }
}

// Used to lock path gen when one is already being generated
let lockPathGen = false;
async function generatePath() {
    if (lockPathGen) { return null; }
    lockPathGen = true;

    const start = getRandomPos();
    const goal = getRandomPos();

    /**
     * @type {utils.Obstacles}
     */
    const obstacles = new Map();
    addHollowRect(obstacles, -1, -1, COLS + 2, ROWS + 2);

    for (let i = 0; i < COLS * ROWS / 3; i++) {
        const pos = getRandomPos();
        if (start.x === pos.x && start.y === pos.y || goal.x === pos.x && goal.y === pos.y) {
            continue;
        }

        if (!obstacles.has(pos.x)) { obstacles.set(pos.x, new Map()); }
        obstacles.get(pos.x).set(pos.y, true);
    }

    const path = await AStar(
        start, goal,
        obstacles, debugData
    );

    lockPathGen = false;
    return path;
}

/**
 * Draws a NodePair to the canvas
 * @param {wCanvas} canvas - The canvas to drawn on
 * @param {utils.NodePair} nodePair - The NodePair to draw
 */
function drawNode(canvas, nodePair) {
    canvas.fillCSS(nodePair[1]);
    canvas.rect(nodePair[0].x * CELL_SIZE, nodePair[0].y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
}

/**
 * Draws Debug Data to the canvas
 * @param {wCanvas} canvas - The canvas to draw the data on
 */
function drawDebug(canvas) {

    for (let i = 0; i < debugData.nodes.length; i++) {
        drawNode(canvas, debugData.nodes[i]);
    }
    
    if (debugData.start && debugData.goal) {
        drawNode(canvas, debugData.start);
        drawNode(canvas, debugData.goal);
    }

    if (debugData.obstacles) {
        debugData.obstacles.forEach(
            nodePair => drawNode(canvas, nodePair)
        );
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
