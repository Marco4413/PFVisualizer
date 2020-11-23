
import * as WorldMap from "./WorldMap.js";

/**
 * @typedef {Object} NodeColors - All the different debug color
 * @property {String} start - The color of the start node
 * @property {String} goal - The color of the goal node
 * @property {String} calculating - The color of the node that is being calculated
 * @property {String} calculated - The color of a node that was already calculated
 * @property {String} path - The color of the path nodes
 */

/**
 * @typedef {Object} DebugData - An object that holds Data for Debugging
 * @property {WorldMap.NodePair} start - The starting node
 * @property {WorldMap.NodePair} goal - The goal node
 * @property {Array<WorldMap.NodePair>} obstacles - All obstacles as NodePairs
 * @property {Array<WorldMap.NodePair>} nodes - All used nodes
 * @property {NodeColors} colors - Colors used for debugging
 * @property {Number} delay - Delay between each move
 */

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
    canvas.rect((x + nodePair[0].x) * cellSize, (y + nodePair[0].y) * cellSize, cellSize, cellSize);
}
