"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateStringSimilarities = exports.diceCoefficient = void 0;
function getBigrams(str) {
    const bigrams = new Set();
    const length = str.length;
    for (let i = 0; i < length - 1; i++) {
        const bigram = str.slice(i, i + 2);
        bigrams.add(bigram);
    }
    return bigrams;
}
function intersect(set1, set2) {
    const intersection = new Set();
    set1.forEach(value => {
        if (set2.has(value)) {
            intersection.add(value);
        }
    });
    return intersection;
}
function diceCoefficient(str1, str2) {
    const bigrams1 = getBigrams(str1);
    const bigrams2 = getBigrams(str2);
    return (2 * intersect(bigrams1, bigrams2).size) / (bigrams1.size + bigrams2.size);
}
exports.diceCoefficient = diceCoefficient;
function rateStringSimilarities(input, target) {
    let ratings = {};
    target.forEach(item => {
        ratings[item] = diceCoefficient(input, item);
    });
}
exports.rateStringSimilarities = rateStringSimilarities;
//# sourceMappingURL=string-compare.js.map