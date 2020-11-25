
import { wCanvas, UMath } from "./wCanvas/wcanvas.js";
import { drawNodePair } from "./utils.js";

export const CELL_TYPES = {
    "WALL": "#889f9f",
    "EMPTY": "#0000",
    "START": "#f00",
    "GOAL": "#0f0",
    "CALCULATING": "#00f",
    "CALCULATED": "#777",
    "PATH": "#dd0"
};

/**
 * An Object containing all cell types that are solid
 */
export const SOLID_CELL_TYPES = { }
SOLID_CELL_TYPES[CELL_TYPES.WALL] = true;

/**
 * An Object containing all cell types that are permanent and can't be changed
 */
export const PERMANENT_CELL_TYPES = { }
PERMANENT_CELL_TYPES[CELL_TYPES.START] = true;
PERMANENT_CELL_TYPES[CELL_TYPES.GOAL] = true;
PERMANENT_CELL_TYPES[CELL_TYPES.WALL] = true;

/** 
 * @typedef {[UMath.Vec2, String]} NodePair - A (Vec2, Color) tuple
 * 
 * @typedef {Map<Number, Map<Number, Boolean>>} InternalWorldMap - A Map that holds the world's map
 */

export class WorldMap {

    /**
     * @param {Number} x - The x pos of the World on the canvas when drawn
     * @param {Number} y - The x pos of the World on the canvas when drawn
     * @param {Number} w - The width (in cells) of the world
     * @param {Number} h - The height (in cells) of the world
     * @param {Boolean} [hasBoundary] - Whether or not the world has boundaries
     * @param {Boolean} [showBounds] - Whether or not to show the world's boudaries
     */
    constructor(x, y, w, h, hasBoundary = true, showBounds = true) {
        this.pos = new UMath.Vec2(x, y);
        this.size = new UMath.Vec2(w, h);

        /** @type {InternalWorldMap} */
        this.map = new Map();

        this.hasBoundary = hasBoundary;
        this.showBounds = showBounds;
    }

    /**
     * Draws the world to the specified canvas with the specified scale
     * @param {wCanvas} canvas - The canvas to draw the world on
     * @param {Number} scale - The Scale of each world's cell
     */
    draw(canvas, scale = 16) {
        if (this.hasBoundary) {
            const offset = this.showBounds ? 1 : 0;
            for (let x = 0 - offset; x < this.size.x + offset; x++) {
                for (let y = 0 - offset; y < this.size.y + offset; y++) {
                    const cell = this.getCell(x, y);
                    if (cell !== CELL_TYPES.EMPTY) {
                        drawNodePair(canvas, [{ x, y }, cell], this.pos.x, this.pos.y, scale);
                    }
                }
            }
        } else {
            this.mapToNodePairArray().forEach(
                nodePair => drawNodePair(canvas, nodePair, this.pos.x, this.pos.y, scale)
            );
        }
    }

    /**
     * Clears the map
     */
    clearMap() {
        this.map = new Map();
    }

    /**
     * Creates an hollow rectangle of the specified cell on the map
     * @param {String} cell - The cell to fill the rectangle with
     * @param {Number} x - The x pos to draw the rectangle at
     * @param {Number} y - The y pos to draw the rectangle at
     * @param {Number} w - The width of the rectangle
     * @param {Number} h - The height of the rectangle
     */
    hollowRect(cell, x, y, w, h) {
        for (let relX = 0; relX < w; relX++) {
            if (relX === 0 || relX === w - 1) {
                for (let relY = 0; relY < h; relY++) {
                    this.putCell(cell, x + relX, y + relY);
                }
            } else {
                this.putCell(cell, x + relX, y);
                this.putCell(cell, x + relX, y + h - 1);
            }
        }
    }
    
    /**
     * Converts this.map to an Array of NodePairs
     * @param {Boolean} ignoreEmptyCells - Whether or not to include explicitly set empty cells on the returned array
     * @returns {Array<NodePair>} - An array of NodePairs to be drawn
     */
    mapToNodePairArray(ignoreEmptyCells = true) {
        const mapArray = [];
        for (const [x, col] of this.map) {
            for (const [y, cell] of col) {
                if (!ignoreEmptyCells || cell !== CELL_TYPES.EMPTY) {
                    mapArray.push([
                        new UMath.Vec2(x, y), cell
                    ]);
                }
            }
        }
        return mapArray;
    }

    /**
     * Picks a random pos within the world and returns it
     * @returns {UMath.Vec2} A random pos within the world
     */
    pickRandomPos() {
        return new UMath.Vec2(Math.floor(Math.random() * this.size.x), Math.floor(Math.random() * this.size.y));
    }

    /**
     * Puts the specified cell on the specified x and y
     * @param {String} cell - The cell to add
     * @param {Number} x - The x coord of the new cell
     * @param {Number} y - The y coord of the new cell
     * @returns {String} The added cell
     */
    putCell(cell = CELL_TYPES.WALL, x, y) {
        const selectedCell = this.getCell(x, y);
        if (PERMANENT_CELL_TYPES[selectedCell]) { return selectedCell; }

        if (!this.map.has(x)) { this.map.set(x, new Map()); }
        this.map.get(x).set(y, cell);
        return cell;
    }

    /**
     * Returns the cell that is on the specified point
     * @param {Number} x - The x pos of the cell
     * @param {Number} y - The y pos of the cell
     * @returns {String} The cell at the specified point
     */
    getCell(x, y) {
        if (this.hasBoundary && (x < 0 || x >= this.size.x || y < 0 || y >= this.size.y)) { return CELL_TYPES.WALL; }

        if (this.map.has(x)) {
            const col = this.map.get(x);
            if (col.has(y)) {
                return col.get(y);
            }
        }

        return CELL_TYPES.EMPTY;
    }

    /**
     * Checks if the specified cell at x, y is of type cell
     * @param {String} cell - The cell type to test for
     * @param {Number} x - The x pos of the cell to check
     * @param {Number} y - The y pos of the cell to check
     * @returns {Boolean} Whether or not the cell is of the specified type
     */
    isCellType(cell = CELL_TYPES.WALL, x, y) {
        return this.getCell(x, y) === cell;
    }

    /**
     * Checks if a cell is solid
     * @param {Number} x - The x pos of the cell to check
     * @param {Number} y - The y pos of the cell to check
     * @returns {Boolean} Whether or not the cell is solid
     */
    isCellSolid(x, y) {
        return SOLID_CELL_TYPES[this.getCell(x, y)] ? true : false;
    }

    /**
     * Searches all (non-solid) neighbours of the specified origin
     * @param {Number} x - The x pos of the origin
     * @param {Number} y - The y pos of the origin
     * @param {Boolean} [diagonals] - Whether or not diagonals are valid neighbours
     * @returns {Array<UMath.Vec2>} An array containing all pos of neighbours
     */
    getNeighbours(x, y, diagonals = false) {
        const origin = { x, y };
        const neighbours = [];
        
        const possibleNeighbours = [
            UMath.Vec2.add(origin, { x:  1, y:  0 }),
            UMath.Vec2.add(origin, { x: -1, y:  0 }),
            UMath.Vec2.add(origin, { x:  0, y:  1 }),
            UMath.Vec2.add(origin, { x:  0, y: -1 })
        ];

        if (diagonals) {
            possibleNeighbours.push(UMath.Vec2.add(origin, { x:  1, y:  0 }));
            possibleNeighbours.push(UMath.Vec2.add(origin, { x: -1, y:  0 }));
            possibleNeighbours.push(UMath.Vec2.add(origin, { x:  0, y:  1 }));
            possibleNeighbours.push(UMath.Vec2.add(origin, { x:  0, y: -1 }));
        }
        
        possibleNeighbours.forEach(
            neighbour => {
                if (!this.isCellSolid(neighbour.x, neighbour.y)) {
                    neighbours.push(neighbour);
                }
            }
        );

        return neighbours;
    }

}
