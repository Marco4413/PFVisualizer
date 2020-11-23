
import { wCanvas, UMath } from "./wCanvas/wcanvas.js";
import * as utils from "./utils.js";
import * as WorldMap from "./WorldMap.js";
import { availableAlgorithms } from "./algorithms/allAlgorithms.js";

const CELL_SIZE = 64;

let COLS = 0;
let ROWS = 0;

const ACTION_TIME = 25;

/** @type {WorldMap.WorldMap} */
const WORLD_MAP = new WorldMap.WorldMap(0, 0, 0, 0, false, false);

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
    WORLD_MAP.hollowRect(WorldMap.CELL_TYPES.WALL, -1, -1, COLS + 2, ROWS + 2);

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
 * @param {wCanvas} canvas
 * @param {Number} deltaTime
 */
function draw(canvas, deltaTime) {
    canvas.backgroundCSS("#000");

    if (WORLD_MAP) {
        WORLD_MAP.draw(canvas, CELL_SIZE);
    }

    canvas.strokeCSS("#444");
    canvas.strokeWeigth(1);
    for (let col = 0; col <= COLS; col++) {
        canvas.line(
            WORLD_MAP.pos.x + col * CELL_SIZE,
            0,
            WORLD_MAP.pos.x + col * CELL_SIZE,
            canvas.canvas.height
        );
    }

    for (let row = 0; row <= ROWS; row++) {
        canvas.line(
            0,
            WORLD_MAP.pos.y + row * CELL_SIZE,
            canvas.canvas.width,
            WORLD_MAP.pos.y + row * CELL_SIZE
        );
    }

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
    if (ev.key === "r") { generatePath(); }
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

            COLS = Math.floor(canvas.canvas.width / CELL_SIZE);
            ROWS = Math.floor(canvas.canvas.height / CELL_SIZE);

            WORLD_MAP.pos.x = (window.innerWidth % CELL_SIZE) / 2;
            WORLD_MAP.pos.y = (window.innerHeight % CELL_SIZE) / 2;
            WORLD_MAP.size.x = COLS;
            WORLD_MAP.size.y = ROWS;
        }
    });
});
