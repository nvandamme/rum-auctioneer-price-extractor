export declare class NumberParser {
    parts: Intl.NumberFormatPart[];
    numerals: string[];
    index: Map<string, number>;
    group: string;
    decimal: string;
    private _group;
    private _decimal;
    private _numerals;
    constructor(locale: string);
    parse(string: string): number;
}
//# sourceMappingURL=intl-number-parser.d.ts.map