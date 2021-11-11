export class NumberParser {

    public parts: Intl.NumberFormatPart[] = [];
    public numerals: string[] = [];
    public index: Map<string, number> = new Map<string, number>();
    public group: string = "";
    public decimal: string = "";
    private _group: RegExp;
    private _decimal: RegExp;
    private _numerals: RegExp;

    constructor(locale: string) {
        this.parts = new Intl.NumberFormat(locale).formatToParts(12345.6);
        this.numerals = [...new Intl.NumberFormat(locale, { useGrouping: false }).format(9876543210)].reverse();
        this.index = new Map(this.numerals.map((d: string, i: number) => [d, i]));
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
    parse(string: string): number {
        string = string.trim()
            .replace(this._group, "")
            .replace(this._decimal, ".")
            .replace(this._numerals, d => {
                let result = this.index?.get(d);
                if (result !== undefined) return result.toString()
                else return ''
            });
        return parseFloat(string);
    }
}