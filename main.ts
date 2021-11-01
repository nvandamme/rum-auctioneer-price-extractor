import * as cheerio from 'cheerio';
const got = require('got');
import * as fs from 'fs';
import * as path from 'path';
import { Command, InvalidArgumentError, Option, OptionValues } from 'commander';
import { DateTime } from "luxon";

class NumberParser {

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
    parse(string: string): Number {
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

const program = new Command();

function parseItemCount(value: string, prev: number) {
    const parsedValue = parseInt(value, 10);
    if (isNaN(parsedValue)) {
        throw new InvalidArgumentError('Invalid number of items to extract.');
    }
    else if (parsedValue <= 0) {
        throw new InvalidArgumentError('Number of items to extract is too low (< 1).');
    }
    else if (parsedValue >= 500) {
        throw new InvalidArgumentError('Number of items to extract is too high (> 500).');
    }
    return parsedValue;
}

async function extractData(options: OptionValues) {
    let outputBuffer = 'name,date,full_price,price,currency\n';
    const url = `${options.url}?text=${options.input}&sort=${options.sort}&items_per_page=${options.items}`;
    const response = await got(url);
    if (response.statusCode !== 200) {
        console.error('request failed');
    }
    else {
        //if (options.debug === true) 
        //console.log(`Got response from '${url}':\n${response.body}`);
        console.log(`Got response from '${url}':`);
        const $ = cheerio.load(response.body);
        
        const lang = $('html').attr('lang');
        let numberParser:NumberParser;
        if (lang !== undefined) numberParser = new NumberParser(lang);

        $('div.views-row.producthomepage').each((i, product) => {

            const name = $(product).find('span.protitle').text();
            const date_string = $(product).find('div.enddatein > span.uc-price').text();
            const date = DateTime.fromFormat(date_string, 'dd.MM.yy');
            let price_string = $(product).find('span > span.uc-price').text().trim().replace(/\s/gi, '');
            let currency: String = "€";
            let price: Number = 0;

            //if (lang == 'en') {
            //    price_string = price_string.replace(/,/gi,'');
            //}

            if (isNaN(parseInt(price_string[0])) === true) {
                currency = price_string[0];
                if (lang) {
                    price = numberParser.parse(price_string.substr(1));
                    price_string = `${currency}${price}`;
                }
                else price = parseFloat(price_string.substr(1));
            }
            else if (isNaN(parseInt(price_string[price_string.length - 1])) === true) {
                currency = price_string[price_string.length - 1];
                if (lang) {
                    price = numberParser.parse(price_string.substr(0, price_string.length - 1));
                    price_string = `${price}${currency}`;
                }
                else price = parseFloat(price_string.substr(0, price_string.length - 1))
            }
            else {
                if (lang) {
                    price = numberParser.parse(price_string)
                    price_string = price.toString();
                }
                else price = parseFloat(price_string);
            }
            outputBuffer += `"${name}","${date.toISODate()}",${price_string},${price},"${currency}"\n`;

        });
    }
    return outputBuffer;
}

program
    .addOption(new Option('-d, --debug', 'output extra debugging').default('https://rumauctioneer.com/auction-search'))
    .addOption(new Option('-u, --url <url>', 'url to parse').default('https://rumauctioneer.com/auction-search'))
    .addOption(new Option('-o, --output <filepath>', 'output to file'))
    .addOption(new Option('-i, --input <keywords>', 'text input to search for').makeOptionMandatory(true))
    .addOption(new Option('-n, --items <number>', 'number of items to extract').argParser<number>(parseItemCount).choices(['20', '40', '100', '500']).default(500))
    .addOption(new Option('-s, --sort <filter>', 'number of items to extract').choices(['field_reference_field_end_date+ASC', 'field_reference_field_end_date+DESC', 'search_api_relevance+ASC', 'search_api_relevance+DESC', 'auc_high_bid_amt+ASC', 'auc_high_bid_amt+DESC']).default('field_reference_field_end_date+DESC', 'By End Date (recent)'))
    .showHelpAfterError()
    ;

program.parse();
const options = program.opts();

if (options.url !== undefined && options.items !== undefined && options.sort !== undefined) {

    extractData(options).then((data) => {

        let filename = "";
        let dirname = "";
        let pathname = "";

        if (options.output === undefined) {
            filename = options.input
                .replace(/\\/gi, '')
                .replace(/\//gi, '')
                .replace(/</gi, '_')
                .replace(/>/gi, '_')
                .replace(/:/gi, '_')
                .replace(/#/gi, '_')
                .replace(/@/gi, '_')
                .replace(/"/gi, '_')
                .replace(/\|/gi, '_')
                .replace(/\?/gi, '_')
                .replace(/\*/gi, '_')
                .replace(/\./gi, '_')
                + '.csv';
            pathname = filename;
            dirname = path.dirname(filename);
        }
        else {
            pathname = options.output;
            filename = path.basename(options.output);
            dirname = path.dirname(options.output);
        }

        //console.log(data);

        if (fs.existsSync(dirname)) {
            fs.writeFile(
                pathname,
                data,
                (err) => {
                    if (err) {
                        console.error(err);
                        console.log(`done! But file output '${pathname}' cannot be written, check path?'`);
                    }
                    console.log(`done!\n Results writed to file ${pathname}`)
                }
            );
        }
        else {
            console.log(`done! But file output '${pathname}' is not accesible, check path?'`);
        }
    });

}

else if (options.help === true) {
    program.help();
}
else {
    console.error(new InvalidArgumentError(`Missing arguments (options:${JSON.stringify(options)})`));
    program.help();
}
