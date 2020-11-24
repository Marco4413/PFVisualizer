
import * as WorldMap from "./WorldMap.js";

/**
 * Capitalizes the specified string
 * @param {String} str - The string to capitalize
 * @returns {String} The capitalized string
 */
export function capitalize(str) {
    return str.substr(0, 1).toUpperCase() + str.substr(1);
}

/**
 * Used to delay function calls
 * @param {Number} ms - milliseconds
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Draws a NodePair to the canvas
 * @param {wCanvas} canvas - The canvas to drawn on
 * @param {WorldMap.NodePair} nodePair - The NodePair to draw
 * @param {Number} x - X pos offset
 * @param {Number} y - Y pos offset
 */
export function drawNodePair(canvas, nodePair, x = 0, y = 0, cellSize = 16) {
    canvas.fillCSS(nodePair[1]);
    canvas.rect(
        x + nodePair[0].x * cellSize, y + nodePair[0].y * cellSize, cellSize, cellSize,
        { "noStroke": true }
    );
}
