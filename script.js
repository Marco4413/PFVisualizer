
import { wCanvas } from "./wCanvas/wcanvas.js";
import { capitalize } from "./utils.js";
import * as WorldMap from "./WorldMap.js";
import { availableAlgorithms } from "./algorithms/allAlgorithms.js";


// SETTINGS
const KEY_BINDINGS = {
    "restart"               : "R",
    "toggle_settings"       : "H",
    "toggle_grid"           : "G",
    "toggle_restart_message": "U",
    "toggle_info"           : "I"
};

const MIN_WORLD_SIZE = 8;
const MAX_WORLD_SIZE = 400;
const MAX_ACTION_TIME = 100;

const GRID_COLOR = "#444";
const BACKGROUND_COLOR = "#000";
const TEXT_OUTLINE = "#000";
const TEXT_COLOR = "#fff"

const MAX_CELL_QUEUE = 10;
// END SETTINGS

let actionDelay = 25;
let gridEnabled = true;
let restartMessage = true;

/** @type {WorldMap.WorldMap} */
const WORLD_MAP = new WorldMap.WorldMap(0, 0, 30, 15, true, true);

let SCALE = 64;
let currentAlgorithm = availableAlgorithms[0];
let isPathGenLocked = false;

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
    canvas.strokeCSS(GRID_COLOR);
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
    canvas.backgroundCSS(BACKGROUND_COLOR);

    if (WORLD_MAP) {
        WORLD_MAP.draw(canvas, SCALE);
    }

    if (gridEnabled) {
        drawGrid(
            canvas,
            WORLD_MAP.pos.x % SCALE, WORLD_MAP.pos.y % SCALE,
            Math.floor(canvas.canvas.width / SCALE), Math.floor(canvas.canvas.height / SCALE),
            SCALE
        );
    }

    if (!isPathGenLocked && restartMessage) {
        const textSize = Math.min(canvas.canvas.width, canvas.canvas.height) / 15;
        canvas.strokeCSS(TEXT_OUTLINE);
        canvas.strokeWeigth(textSize / 55);
        canvas.fillCSS(TEXT_COLOR);
        canvas.textSize(textSize);
        canvas.text(
            `Press ${KEY_BINDINGS.restart} to generate a new path`, canvas.canvas.width / 2, canvas.canvas.height / 2,
            { "horizontalAlignment": "center", "verticalAlignment": "center", "noStroke": false }
        );
    }
}

function recalcScale() {
    SCALE = Math.min(
        Math.floor(window.innerHeight / WORLD_MAP.size.y),
        Math.floor(window.innerWidth / WORLD_MAP.size.x)
    );

    WORLD_MAP.pos.x = Math.floor((window.innerWidth - WORLD_MAP.size.x * SCALE) / 2);
    WORLD_MAP.pos.y = Math.floor((window.innerHeight - WORLD_MAP.size.y * SCALE) / 2);
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
            currentAlgorithm = i;
            return;
        }
    }
    console.log(`No Algorithm was found for ${element.value}`);
}

const pathGenerator = new Worker("./genPath.js", { "type": "module" });
pathGenerator.addEventListener("message", ev => {
    const [ messageType, ...args ] = ev.data;
    switch (messageType) {
        case "map_add_cells": {
            for (let i = 0; i < args.length; i += 3) {
                WORLD_MAP.putCell(args[i], args[i + 1], args[i + 2]);
            }
            break;
        }
        case "map_reset": {
            WORLD_MAP.clearMap();
            break;
        }
        case "state_change": {
            if (args[0] === "start") {
                isPathGenLocked = true;
            } else if (args[0] === "stop") {
                isPathGenLocked = false;
            }
            break;
        }
    }
});

function generatePath() {
    if (isPathGenLocked) { return; }
    pathGenerator.postMessage([ MAX_CELL_QUEUE, currentAlgorithm, actionDelay, WORLD_MAP.size.x, WORLD_MAP.size.y, WORLD_MAP.hasBoundary]);
}

/**
 * Change's the world's size based on what the input element contains
 * @param {HTMLInputElement} element - The element that contains the new size
 * @param {"x"|"y"} axis - The axis the size should be change on
 */
window.changeWorldSize = (element, axis) => {
    const newValue = parseInt(element.value);
    if (isPathGenLocked || Number.isNaN(newValue) || newValue < MIN_WORLD_SIZE || newValue > MAX_WORLD_SIZE) {
        element.value = "";
    } else {
        WORLD_MAP.clearMap();
        WORLD_MAP.size[axis] = newValue;

        recalcScale();
    }
}

{
    let placeholder;
    /**
     * Changes the delay between each Path Finding key move
     * @param {HTMLInputElement} element - The element to take the value from
     * @param {String} noDelayPH - The placeholder used when no delay is none
     */
    window.changeActionDelay = (element, noDelayPH) => {
        if (placeholder === undefined) { placeholder = element.placeholder; }

        const newDelay = parseFloat(element.value);
        if (isPathGenLocked || Number.isNaN(newDelay) || newDelay > MAX_ACTION_TIME) {
            element.value = "";
        } else if (newDelay <= 0) {
            element.value = "";
            if (noDelayPH) { element.blur(); element.placeholder = noDelayPH; }
            actionDelay = undefined;
        } else {
            element.placeholder = placeholder;
            actionDelay = newDelay;
        }
    }
}

window.addEventListener("keydown", ev => {
    switch (ev.key.toUpperCase()) {
        case KEY_BINDINGS.restart: {
            generatePath();
            break;
        }
        case KEY_BINDINGS.toggle_settings: {
            const settingsPanel = document.getElementById("settingsPanel");
            settingsPanel.classList.toggle("hidden");
            break;
        }
        case KEY_BINDINGS.toggle_grid: {
            gridEnabled = !gridEnabled;
            break;
        }
        case KEY_BINDINGS.toggle_restart_message: {
            restartMessage = !restartMessage;
            break;
        }
        case KEY_BINDINGS.toggle_info: {
            const infoPanel = document.getElementById("infoPanel");
            infoPanel.classList.toggle("hidden");
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

    /** @type {HTMLDivElement} */
    const infoPanel = document.getElementById("infoPanel");
    Object.keys(WorldMap.CELL_TYPES).forEach(type => {
        const cellTypeDiv = document.createElement("div");
        cellTypeDiv.innerHTML = `<span style="color: ${WorldMap.CELL_TYPES[type]}">■</span> : ${capitalize(type.toLowerCase())}`;
        cellTypeDiv.classList.add("infoItem");
        infoPanel.appendChild(cellTypeDiv);
    });

    Object.keys(KEY_BINDINGS).forEach(action => {
        const key = KEY_BINDINGS[action];
        const actionDiv = document.createElement("div");
        const formattedAction = action.split("_").map(s => capitalize(s)).join(" ");
        actionDiv.innerText = `${key} : ${formattedAction}`;
        actionDiv.classList.add("infoItem");
        infoPanel.appendChild(actionDiv);
    });

    new wCanvas({
        "onDraw": draw,
        "onResize": (canvas) => {
            canvas.canvas.width = window.innerWidth + 1;
            canvas.canvas.height = window.innerHeight + 1;

            recalcScale();
        }
    });
});
