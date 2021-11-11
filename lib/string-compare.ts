function getBigrams(str: string) {
    const bigrams = new Set<string>();
    const length = str.length;
    for (let i = 0; i < length - 1; i++) {
        const bigram = str.slice(i, i + 2);
        bigrams.add(bigram);
    }
    return bigrams;
}

function intersect(set1: Set<string>, set2: Set<string>) {
    const intersection = new Set();
    set1.forEach(value => {
        if (set2.has(value)) {
            intersection.add(value);
        }
    });
    return intersection;
}

export function diceCoefficient(str1: string, str2: string) {
    const bigrams1 = getBigrams(str1);
    const bigrams2 = getBigrams(str2);
    return (2 * intersect(bigrams1, bigrams2).size) / (bigrams1.size + bigrams2.size);
}

export function rateStringSimilarities(input: string, target: Array<string>) {
    let ratings: { [name: string]: number } = {}; 
    target.forEach(item => {
        ratings[item] = diceCoefficient(input, item);
    });
}