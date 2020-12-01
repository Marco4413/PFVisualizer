
import * as WorldMap from "./WorldMap.js";
import { availableAlgorithms } from "./algorithms/allAlgorithms.js";

// Used to lock path gen when one is already being generated
let lockPathGen = false;
/**
 * Generates a starting point, an end point, a WorldMap with random walls and calculates the path from start to end
 * @returns {Array<UMath.Vec2>} The path to the goal
 */
async function generatePath(WORLD_MAP, algorithm, actionDelay = 0) {
    if (lockPathGen) { return null; }
    lockPathGen = true;
    self.postMessage([ "state_change", "start" ]);

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

    const path = await algorithm.search(
        start, goal,
        WORLD_MAP, actionDelay
    );

    WORLD_MAP.sendCellQueue();

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
