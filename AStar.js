
import { UMath } from "./wCanvas/wcanvas.js";
import * as utils from "./utils.js";
import { WorldMap, EMPTY_CELL } from "./WorldMap.js";

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
 * @param {utils.DebugData} debugData - Debug Data for Debugging
 * @returns {Array<UMath.Vec2>} The path from node to the start
 */
async function recostructPath(cameFrom, node, debugData = {}) {
    const path = [ node ];
    
    // DEBUG CODE
    if (debugData.nodes) {
        debugData.nodes.push([ node, debugData.colors.path ]);
    }
    // DEBUG CODE

    let current = node.toString();
    while (cameFrom.get(current) !== undefined) {
        current = cameFrom.get(current);
        
        // DEBUG CODE
        if (debugData.delay) {
            await utils.sleep(debugData.delay);
        }

        if (debugData.nodes) {
            debugData.nodes.push([ UMath.Vec2.fromString(current), debugData.colors.path ]);
        }
        // DEBUG CODE
        
        path.unshift(UMath.Vec2.fromString(current));
    }

    return path;
}

/**
 * The AStar search algorithm (source: https://en.wikipedia.org/wiki/A*_search_algorithm)
 * @param {UMath.Vec2} start - The starting node
 * @param {UMath.Vec2} goal - The goal
 * @param {WorldMap} worldMap - The World to search in
 * @param {utils.DebugData} debugData - Data for Debugging
 * @returns {Array<UMath.Vec2>} The path from start to goal
 */
export async function AStar(start, goal, worldMap, debugData = {}) {
    // DEBUG CODE
    if (debugData.nodes) {
        debugData.nodes = [];

        debugData.start = [ start, debugData.colors.start ];
        debugData.goal = [ goal , debugData.colors.goal ];
    }
    // DEBUG CODE

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
    fScore.set(start.toString(), start.distSq(goal));

    while (openSet.length > 0) {
        const [ current, currentIndex ] = lowestFScore(openSet, fScore);
        const currentStr = current.toString();
        if (gScore.get(currentStr) === undefined) { gScore.set(currentStr, Number.POSITIVE_INFINITY); }

        if (current.x === goal.x && current.y === goal.y) {
            return await recostructPath(cameFrom, current, debugData);
        }

        openSet.splice(currentIndex, 1);

        const neighbours = [];
        [
            UMath.Vec2.add(current, { x:  1, y:  0 }),
            UMath.Vec2.add(current, { x: -1, y:  0 }),
            UMath.Vec2.add(current, { x:  0, y:  1 }),
            UMath.Vec2.add(current, { x:  0, y: -1 })
        ].forEach(
            neighbour => {
                if (worldMap.getCell(neighbour.x, neighbour.y) === EMPTY_CELL) {
                    neighbours.push(neighbour);
                }
            }
        );

        for (let i = 0; i < neighbours.length; i++) {

            const neighbour = neighbours[i];
            const neighbourStr = neighbour.toString();

            { // DEBUG CODE
                const thisDebugNode = [ neighbour, debugData.colors.calculating ];
                if (debugData.nodes) {
                    debugData.nodes.push(thisDebugNode);
                }

                if (debugData.delay) {
                    await utils.sleep(debugData.delay);
                }

                thisDebugNode[1] = debugData.colors.calculated;
            } // DEBUG CODE
            
            if (gScore.get(neighbourStr) === undefined) { gScore.set(neighbourStr, Number.POSITIVE_INFINITY); }

            const tentativeGScore = gScore.get(currentStr) + current.distSq(neighbour);
            if (tentativeGScore < gScore.get(neighbourStr)) {
                cameFrom.set(neighbourStr, currentStr);
                gScore.set(neighbourStr, tentativeGScore);
                fScore.set(neighbourStr, gScore.get(neighbourStr) + neighbour.distSq(goal));
                if (!openSet.includes(neighbour)) { openSet.push(neighbour); }
            }
        }
    }

    return [];
}
