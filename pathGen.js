
import * as WorldMap from "./WorldMap.js";
import { availableAlgorithms } from "./algorithms/allAlgorithms.js";

// Used to lock path gen when one is already being generated
let lockPathGen = false;
/**
 * Generates a starting point, an end point, a WorldMap with random walls and calculates the path from start to end
 * @param {WorldMap.WorkerWorldMap} worldMap - The world map to get cell data from
 * @param {availableAlgorithms[0]} algorithm - The algorithm to use
 * @param {Number} actionDelay - The delay between each algorithm's move
 * @returns {Array<UMath.Vec2>} The path to the goal
 */
async function generatePath(worldMap, algorithm, actionDelay = 0) {
    if (lockPathGen) { return null; }
    lockPathGen = true;
    self.postMessage([ "lock_gen" ]);

    worldMap.clearMap();
    
    const start = worldMap.pickRandomPos();
    const goal = worldMap.pickRandomPos();

    for (let i = 0; i < worldMap.size.x * worldMap.size.y / 3; i++) {
        const pos = worldMap.pickRandomPos();
        if (start.x === pos.x && start.y === pos.y || goal.x === pos.x && goal.y === pos.y) {
            continue;
        }

        worldMap.putCell(WorldMap.CELL_TYPES.WALL, pos.x, pos.y);
    }

    const path = await algorithm.search(
        start, goal,
        worldMap, actionDelay
    );

    worldMap.sendCellQueue();

    lockPathGen = false;
    self.postMessage([ "unlock_gen" ]);
    return path;
}

self.addEventListener("message", ev => {
    /** @type {[ Number, Number, Number, Number, Number, Boolean ]} */
    const [ width, height, hasBounds, actionTime, maxCellQueue, algoIndex ] = ev.data;
    const worldMap = new WorldMap.WorkerWorldMap(self, width, height, hasBounds, actionTime > 0, maxCellQueue);

    generatePath(worldMap, availableAlgorithms[algoIndex], actionTime);
});
