
import { UMath } from "../wCanvas/wcanvas.js";
import * as utils from "../utils.js";
import { WorldMap, CELL_TYPES } from "../WorldMap.js";

/**
 * Searches the cell that has the lowest fScore
 * @param {Array<UMath.Vec2>} set - The openSet to search in
 * @param {Map<String, Number>} fScore - The Map that contains all recorded fScores
 * @returns {[UMath.Vec2, Number]} A (cell, index) tuple
 */
function lowestFScore(set, fScore) {
    let lowestFScore = Number.POSITIVE_INFINITY;
    let lowestScoreNodeIndex;
    for (let i = 0; i < set.length; i++) {
        const n = set[i];
        const nStr = n.toString();
        if (fScore.get(nStr) === undefined) { fScore.set(nStr, Number.POSITIVE_INFINITY); }

        if (fScore.get(nStr) <= lowestFScore) {
            lowestFScore = fScore.get(nStr);
            lowestScoreNodeIndex = i;
        }
    }
    return [ set[lowestScoreNodeIndex], lowestScoreNodeIndex ];
}

/**
 * Returns the path from the specified node to the start
 * @param {Map<String, String>} cameFrom - The Map which contains all previous pos
 * @param {UMath.Vec2} node - The node to generate the path for
 * @param {WorldMap} worldMap - The World the path is in
 * @param {Number} actionDelay - Delay between actions
 * @returns {Array<UMath.Vec2>} The path from node to the start
 */
async function recostructPath(cameFrom, node, worldMap, actionDelay) {
    const path = [ node ];

    worldMap.putCell(CELL_TYPES.PATH, node.x, node.y)

    let current = node.toString();
    while (cameFrom.get(current) !== undefined) {
        current = cameFrom.get(current);
        const currentVec = UMath.Vec2.fromString(current);
        
        if (actionDelay) {
            await utils.sleep(actionDelay);
        }

        worldMap.putCell(CELL_TYPES.PATH, currentVec.x, currentVec.y)
        
        path.unshift(currentVec);
    }

    return path;
}

/**
 * Estimates the cost to reach goal from node
 * @param {UMath.Vec2} node - The node to start on
 * @param {UMath.Vec2} goal - The end node
 * @returns {Number} The cost to reah the goal
 */
function heuristic(node, goal) {
    return node.distSq(goal);
}

/**
 * Calculates the cost to go from current to next
 * @param {UMath.Vec2} current - The node we're currently on
 * @param {UMath.Vec2} next - The node we want to go to
 * @param {UMath.Vec2} start - The starting node
 * @param {UMath.Vec2} goal - The ending node
 * @returns {Number} The cost to reach next from current
 */
function edgeWeigth(current, next, start, goal) {
    const distToNext = current.distSq(next);
    // If we're going away from the goal we want to go ham on the cost
    return distToNext + (next.distSq(goal) > current.distSq(goal) ? distToNext * 10 : distToNext);
}

/**
 * The AStar search algorithm (source: https://en.wikipedia.org/wiki/A*_search_algorithm)
 * @param {UMath.Vec2} start - The starting node
 * @param {UMath.Vec2} goal - The goal
 * @param {WorldMap} worldMap - The World to search in
 * @param {Number} [actionDelay] - Delay between actions
 * @param {(node: UMath.Vec2, goal: UMath.Vec2) -> Number} [h] - Calculates the cost to go from node to goal
 * @param {(current: UMath.Vec2, next: UMath.Vec2, start: UMath.Vec2, goal: UMath.Vec2) -> Number} [d] - Calculates the cost to go from current to next
 * @returns {Array<UMath.Vec2>} The path from start to goal
 */
export async function AStar(start, goal, worldMap, actionDelay, h = heuristic, d = edgeWeigth) {

    worldMap.putCell(CELL_TYPES.START, start.x, start.y);
    worldMap.putCell(CELL_TYPES.GOAL, goal.x, goal.y);

    const openSet = [ start ];

    /**
     * @type {Map<String, String>}
     */
    const cameFrom = new Map();

    /**
     * @type {Map<String, Number>}
     */
    const gScore = new Map();
    gScore.set(start.toString(), 0);

    /**
     * @type {Map<String, Number>}
     */
    const fScore = new Map();
    fScore.set(start.toString(), h(start, goal));

    while (openSet.length > 0) {
        const [ current, currentIndex ] = lowestFScore(openSet, fScore);
        const currentStr = current.toString();
        if (gScore.get(currentStr) === undefined) { gScore.set(currentStr, Number.POSITIVE_INFINITY); }

        if (current.x === goal.x && current.y === goal.y) {
            return await recostructPath(cameFrom, current, worldMap, actionDelay);
        }

        openSet.splice(currentIndex, 1);

        const neighbours = worldMap.getNeighbours(current.x, current.y);

        for (let i = 0; i < neighbours.length; i++) {

            const neighbour = neighbours[i];
            const neighbourStr = neighbour.toString();

            worldMap.putCell(CELL_TYPES.CALCULATING, neighbour.x, neighbour.y);
            
            if (actionDelay) {
                await utils.sleep(actionDelay);
            }
                
            worldMap.putCell(CELL_TYPES.CALCULATED, neighbour.x, neighbour.y);
            
            if (gScore.get(neighbourStr) === undefined) { gScore.set(neighbourStr, Number.POSITIVE_INFINITY); }

            const tentativeGScore = gScore.get(currentStr) + d(current, neighbour, start, goal);
            if (tentativeGScore < gScore.get(neighbourStr)) {
                cameFrom.set(neighbourStr, currentStr);
                gScore.set(neighbourStr, tentativeGScore);
                fScore.set(neighbourStr, gScore.get(neighbourStr) + h(neighbour, goal));
                if (!openSet.includes(neighbour)) { openSet.push(neighbour); }
            }
        }
    }

    return [];
}
