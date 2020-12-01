
import * as WorldMap from "./WorldMap.js";
import { availableAlgorithms } from "./algorithms/allAlgorithms.js";

// Used to lock path gen when one is already being generated
let lockPathGen = false;
/**
 * Generates a starting point, an end point, a WorldMap with random walls and calculates the path from start to end
 * @param {WorldMap.WorldMap} worldMap - The world map to get cell data from
 * @param {availableAlgorithms[0]} algorithm - The algorithm to use
 * @param {Number} actionDelay - The delay between each algorithm's move
 * @returns {Array<UMath.Vec2>} The path to the goal
 */
async function generatePath(worldMap, algorithm, actionDelay = 0) {
    if (lockPathGen) { return null; }
    lockPathGen = true;
    self.postMessage([ "state_change", "start" ]);

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
    self.postMessage([ "state_change", "stop" ]);
    return path;
}

self.addEventListener("message", ev => {
    const [ maxCellQueue, algoIndex, actionTime, width, height, hasBounds ] = ev.data;
    const wm = new WorldMap.WorldMap(0, 0, width, height, hasBounds);

    const nativePutCell = wm.putCell.bind(wm);
    const nativeClearMap = wm.clearMap.bind(wm);

    wm.cellQueue = [];
    wm.sendCellQueue = () => {
        const msg = [ "map_add_cells" ];
        msg.push(...wm.cellQueue);
        self.postMessage(msg);
        wm.cellQueue = [];
    }

    wm.putCell = (cellType, x, y) => {
        nativePutCell(cellType, x, y);

        if (actionTime > 0) {
            self.postMessage([ "map_add_cells", cellType, x, y ]);
        } else {
            wm.cellQueue.push(cellType, x, y);
            if (wm.cellQueue.length >= maxCellQueue) {
                wm.sendCellQueue();
            }
        }
    }
    wm.clearMap = () => {
        nativeClearMap();
        self.postMessage([ "map_reset" ]);
    };

    generatePath(wm, availableAlgorithms[algoIndex], actionTime);
});
