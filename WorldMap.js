
import { wCanvas, UMath } from "./wCanvas/wcanvas.js";
import { drawNodePair } from "./utils.js";

export const WALL_CELL = "#fff";
export const EMPTY_CELL = "#0000";

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
        this.mapToNodePairArray().forEach(
            nodePair => drawNodePair(canvas, nodePair, this.pos.x, this.pos.y, scale)
        );
    }
    
    /**
     * Converts this.map to an Array of NodePairs
     * @param {Boolean} ignoreEmptyCells - Whether or not to include empty cells on the returned array
     * @returns {Array<NodePair>} - An array of NodePairs to be drawn
     */
    mapToNodePairArray(ignoreEmptyCells = true) {
        const mapArray = [];
        for (let x = this.showBounds ? -1 : 0; x < this.size.x + (this.showBounds ? 1 : 0); x++) {
            for (let y = this.showBounds ? -1 : 0; y < this.size.y + (this.showBounds ? 1 : 0); y++) {
                const cell = this.getCell(x, y);
                if (!ignoreEmptyCells || cell !== EMPTY_CELL) {
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
    putCell(cell = WALL_CELL, x, y) {
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
        if (this.hasBoundary && (x < 0 || x >= this.size.x || y < 0 || y >= this.size.y)) { return WALL_CELL; }

        if (this.map.has(x)) {
            const col = this.map.get(x);
            if (col.has(y)) {
                return col.get(y);
            }
        }

        return EMPTY_CELL;
    }

    /**
     * Checks if the specified cell at x, y is of type cell
     * @param {String} cell - The cell type to test for
     * @param {Number} x - The x pos of the cell to check
     * @param {Number} y - The y pos of the cell to check
     * @returns {Boolean} Whether or not the cell is of the specified type
     */
    isCellType(cell = WALL_CELL, x, y) {
        return this.getCell(x, y) === cell;
    }

}
