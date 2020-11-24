
import { wCanvas, UMath } from "./wCanvas/wcanvas.js";
import * as WorldMap from "./WorldMap.js";
import { availableAlgorithms } from "./algorithms/allAlgorithms.js";

const KEY_BINDINGS = {
    "restart"          : "R",
    "toggleAlgoSelect" : "H"
};

let SCALE = 64;

const ACTION_TIME = 25;

/** @type {WorldMap.WorldMap} */
const WORLD_MAP = new WorldMap.WorldMap(0, 0, 30, 15, true, true);

let currentAlgorithm = availableAlgorithms[0];

// Used to lock path gen when one is already being generated
let lockPathGen = false;
/**
 * Generates a starting point, an end point, a WorldMap with random walls and calculates the path from start to end
 * @returns {Array<UMath.Vec2>} The path to the goal
 */
async function generatePath() {
    if (lockPathGen) { return null; }
    lockPathGen = true;

    WORLD_MAP.clearMap();

    const start = WORLD_MAP.pickRandomPos();
    const goal = WORLD_MAP.pickRandomPos();

    for (let i = 0; i < WORLD_MAP.size.x * WORLD_MAP.size.y / 3; i++) {
        const pos = WORLD_MAP.pickRandomPos();
        if (start.x === pos.x && start.y === pos.y || goal.x === pos.x && goal.y === pos.y) {
            continue;
        }

        WORLD_MAP.putCell(WorldMap.CELL_TYPES.WALL, pos.x, pos.y);
    }

    const path = await currentAlgorithm.search(
        start, goal,
        WORLD_MAP, ACTION_TIME
    );

    lockPathGen = false;
    return path;
}

/**
 * Draws a grid on the specified pos with the specified size
 * @param {wCanvas} canvas - The canvas to draw the grid on
 * @param {Number} x - The x pos of the origin of the grid
 * @param {Number} y - The y pos of the origin of the grid
 * @param {Number} cols - The number of columns in the grid
 * @param {Number} rows - The number of rows in the grid
 * @param {Number} cellSize - The spacing between each column and row
 */
function drawGrid(canvas, x, y, cols, rows, cellSize) {
    canvas.strokeCSS("#444");
    canvas.strokeWeigth(1);

    if (cellSize < 1) { return; }
    for (let col = 0; col <= cols; col++) {
        canvas.line(
            x + col * cellSize, 0,
            x + col * cellSize, canvas.canvas.height
        );
    }

    for (let row = 0; row <= rows; row++) {
        canvas.line(
            0, y + row * cellSize,
            canvas.canvas.width, y + row * cellSize
        );
    }

}

/**
 * @param {wCanvas} canvas
 * @param {Number} deltaTime
 */
function draw(canvas, deltaTime) {
    canvas.backgroundCSS("#000");

    if (WORLD_MAP) {
        WORLD_MAP.draw(canvas, SCALE);
    }

    drawGrid(
        canvas,
        WORLD_MAP.pos.x % SCALE, WORLD_MAP.pos.y % SCALE,
        Math.floor(canvas.canvas.width / SCALE), Math.floor(canvas.canvas.height / SCALE),
        SCALE
    );

    if (!lockPathGen) {
        canvas.strokeCSS("#000");
        canvas.strokeWeigth(SCALE / 55);
        canvas.fillCSS("#fff");
        canvas.textSize(SCALE * 0.88);
        canvas.text(
            `Press ${KEY_BINDINGS.restart} to generate a new path`, canvas.canvas.width / 2, canvas.canvas.height / 2,
            { "horizontalAlignment": "center", "verticalAlignment": "center", "noStroke": false }
        );
    }
}

/**
 * Changes the current algorithm based on a select HTML Element
 * @param {HTMLSelectElement} element - The select HTML Element to take info from
 */
window.changeAlgorithm = (element) => {
    console.log(`Selected Algorithm: ${element.value}`);
    for (let i = 0; i < availableAlgorithms.length; i++) {
        if (availableAlgorithms[i].longName === element.value) {
            console.log(`Chosen Algorithm was found at index ${i}`);
            currentAlgorithm = availableAlgorithms[i];
            return;
        }
    }
    console.log(`No Algorithm was found for ${element.value}`);
}

window.addEventListener("keydown", ev => {
    switch (ev.key.toUpperCase()) {
        case KEY_BINDINGS.restart: {
            generatePath();
            break;
        }
        case KEY_BINDINGS.toggleAlgoSelect: {
            const algorithmSelect = document.getElementById("algoSelect");
            algorithmSelect.classList.toggle("hidden");
            break;
        }
    }
});

window.addEventListener("load", () => {
    /** @type {HTMLSelectElement} */
    const algorithmSelect = document.getElementById("algoSelect");
    availableAlgorithms.forEach(
        algo => {
            const option = document.createElement("option");
            option.value = algo.longName;
            option.text = `${algo.longName} (${algo.shortName})`;
            algorithmSelect.appendChild(option);
        }
    );
    window.changeAlgorithm(algorithmSelect);

    new wCanvas({
        "onDraw": draw,
        "onResize": (canvas) => {
            canvas.canvas.width = window.innerWidth + 1;
            canvas.canvas.height = window.innerHeight + 1;

            SCALE = Math.min(
                Math.floor(window.innerHeight / WORLD_MAP.size.y),
                Math.floor(window.innerWidth / WORLD_MAP.size.x)
            );

            WORLD_MAP.pos.x = (window.innerWidth - WORLD_MAP.size.x * SCALE) / 2;
            WORLD_MAP.pos.y = (window.innerHeight - WORLD_MAP.size.y * SCALE) / 2;
        }
    });
});
