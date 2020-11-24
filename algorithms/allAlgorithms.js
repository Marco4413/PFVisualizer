
import { AStar } from "./AStar.js";
import { Dijkstra } from "./Dijkstra.js";

export const availableAlgorithms = [
    {
        "shortName": "A*",
        "longName": "AStar",
        "search": AStar
    },
    {
        "shortName": "DSPF",
        "longName": "Dijkstra",
        "search": Dijkstra
    }
];
