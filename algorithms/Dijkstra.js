
import { AStar } from "./AStar.js";

/**
 * The Dijkstra search algorithm (source: https://en.wikipedia.org/wiki/Dijkstra%27s_algorithm)
 * @param {UMath.Vec2} start - The starting node
 * @param {UMath.Vec2} goal - The goal
 * @param {WorldMap} worldMap - The World to search in
 * @param {Number} [actionDelay] - Delay between actions
 * @returns {Array<UMath.Vec2>} The path from start to goal
 */
export async function Dijkstra(start, goal, worldMap, actionDelay) {
    return await AStar(start, goal, worldMap, actionDelay, () => 0, (c, n) => c.distSq(n));
}
