"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NumberParser = void 0;
class NumberParser {
    constructor(locale) {
        this.parts = [];
        this.numerals = [];
        this.index = new Map();
        this.group = "";
        this.decimal = "";
        this.parts = new Intl.NumberFormat(locale).formatToParts(12345.6);
        this.numerals = [...new Intl.NumberFormat(locale, { useGrouping: false }).format(9876543210)].reverse();
        this.index = new Map(this.numerals.map((d, i) => [d, i]));
        const g = this.parts.find(d => d.type === "group");
        if (g !== undefined) {
            this.group = g.value;
        }
        this._group = new RegExp(`[${this.group}]`, "g");
        const d = this.parts.find(d => d.type === "decimal");
        if (d !== undefined) {
            this.decimal = d.value;
        }
        this._decimal = new RegExp(`[${this.decimal}]`);
        this._numerals = new RegExp(`[${this.numerals.join("")}]`, "g");
    }
    parse(string) {
        string = string.trim()
            .replace(this._group, "")
            .replace(this._decimal, ".")
            .replace(this._numerals, d => {
            var _a;
            let result = (_a = this.index) === null || _a === void 0 ? void 0 : _a.get(d);
            if (result !== undefined)
                return result.toString();
            else
                return '';
        });
        return parseFloat(string);
    }
}
exports.NumberParser = NumberParser;
//# sourceMappingURL=intl-number-parser.js.map