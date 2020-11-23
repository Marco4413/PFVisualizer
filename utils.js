
import { UMath } from "./wCanvas/wcanvas.js";

/**
 * @typedef {Object} NodeColors - All the different debug color
 * @property {String} start - The color of the start node
 * @property {String} goal - The color of the goal node
 * @property {String} calculating - The color of the node that is being calculated
 * @property {String} calculated - The color of a node that was already calculated
 * @property {String} path - The color of the path nodes
 * @property {String} obstacles - The color of the obstacle nodes
 * 
 * @typedef {[UMath.Vec2, String]} NodePair - A Vec2, Color tuple
 * 
 * @typedef {Map<Number, Map<Number, Boolean>>} Obstacles - A Map of obstacles
 */

/**
 * @typedef {Object} DebugData - An object that holds Data for Debugging
 * @property {NodePair} start - The starting node
 * @property {NodePair} goal - The goal node
 * @property {Array<NodePair>} obstacles - All obstacles as NodePairs
 * @property {Array<NodePair>} nodes - All used nodes
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
 * Checks if the specified pos is blocked
 * @param {Obstacles} obstacles - The obstacles to use to check if the point is blocked
 * @param {Number} x - The x pos to check
 * @param {Number} y - The y pos to check
 * @returns {Boolean} Whether or not the pos is blocked
 */
export function isBlocked(obstacles, x, y) {
    return obstacles.has(x) && obstacles.get(x).has(y);
}

/**
 * Generates an Array of NodePairs from obstacles
 * @param {Obstacles} obstacles - The obstacles to process
 * @param {String} color - The color of the NodePairs
 * @returns {Array<NodePair>} An Array of NodePairs from obstacles
 */
export function obstaclesToNodePairArray(obstacles, color) {
    const obsArray = [];
    for (const [x, col] of obstacles) {
        for (const [y] of col) {
            obsArray.push([
                new UMath.Vec2(x, y), color
            ]);
        }
    }
    return obsArray;
}
