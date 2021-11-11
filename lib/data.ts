import * as cheerio from 'cheerio';
const got = require('got');
import { promises as fs } from 'fs';
import { constants } from 'fs';
import * as path from 'path';
import { InvalidArgumentError, Option, OptionValues } from 'commander';
import { DateTime } from "luxon";
import { NumberParser } from "./intl-number-parser"
import { dir } from 'console';
import { Interface } from 'readline';

export interface DataItem {
    name: string,
    date: DateTime,
    price: number,
    currency: string,
    raw_date: string,
    raw_price: string,
}

export type DataTable = Array<DataItem>;

export async function loadDB(): Promise<DataTable> {
    try {
        await fs.access('./db/data.json', constants.R_OK);
    }
    catch (err: any) {
        return [];
    }
    let jsonDB = await fs.readFile('./db/data.json', { encoding: 'utf-8' });
    try {
        return JSON.parse(jsonDB);
    }
    catch {
        return []
    }
}

export async function saveDB(data: DataTable) {
    let jsonDB = JSON.stringify(data);
    try {
        await fs.access('./db', constants.O_DIRECTORY | constants.R_OK);
        await fs.writeFile('./db/data.json', jsonDB);
    }
    catch (err: any) {
        try {
            await fs.mkdir('./db');
            await fs.writeFile('./db/data.json', jsonDB);
        }
        catch (err: any) {
            throw err;
        }
    }
}

export async function getData(options: OptionValues) {
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
        let numberParser: NumberParser;
        if (lang !== undefined) numberParser = new NumberParser(lang);

        let data: DataTable = [];

        let db: DataTable = await loadDB();

        let dbHasChanges: boolean = false;

        $('div.views-row.producthomepage').each((i, product) => {
            const name = $(product).find('span.protitle').text().trim();
            const date_string = $(product).find('div.enddatein > span.uc-price').text().trim();
            const date = DateTime.fromFormat(date_string, 'dd.MM.yy');
            const price_string = $(product).find('span > span.uc-price').text().trim();
            let currency: string = "€";
            let price: number = 0;

            let raw_price = price_string.replace(/\s/gi, '')

            if (name != "" && date != null) {

                if (isNaN(parseInt(raw_price[0])) === true) {
                    currency = raw_price[0];
                    if (lang) {
                        price = numberParser.parse(raw_price.substr(1));
                        //price_string = `${currency}${price}`;
                    }
                    else price = parseFloat(raw_price.substr(1));
                }
                else if (isNaN(parseInt(raw_price[raw_price.length - 1])) === true) {
                    currency = raw_price[raw_price.length - 1];
                    if (lang) {
                        price = numberParser.parse(raw_price.substr(0, raw_price.length - 1));
                        //price_string = `${price}${currency}`;
                    }
                    else price = parseFloat(raw_price.substr(0, raw_price.length - 1))
                }
                else {
                    if (lang) {
                        price = numberParser.parse(raw_price)
                        //price_string = price.toString();
                    }
                    else price = parseFloat(raw_price);
                }

                if (price != null && isNaN(price) != true) {

                    const extractedItem: DataItem = {
                        name: name,
                        date: date,
                        price: price,
                        currency: currency,
                        raw_date: date_string,
                        raw_price: price_string
                    }

                    // check if auction date for `name` is not already extracted and add to json db
                    if (db.some(item => item.date === date && item.name === name) !== true) {
                        db.push(extractedItem);
                        dbHasChanges = true;
                    }
                    data.push(extractedItem);
                }
            }
        });
        if (dbHasChanges) {
            await saveDB(data);
        }

        return data;
    }
    return null;
}

export async function encodeData(data: DataTable, options: OptionValues) {
    if (options.format === 'json') {
        return JSON.stringify(data);
    }
    else if (options.format === 'csv') {
        let outputBuffer = 'name,date,price,currency,raw_date,raw_price\n';
        data.forEach(e => {
            outputBuffer += `"${e.name}","${e.date.toISODate()}",${e.price},"${e.currency},${e.raw_date},${e.raw_price}"\n`;
        });
        return outputBuffer;
    }
    else {
        throw new InvalidArgumentError(`Format output unknown: ${options.format}`);
    }
}

export async function writeData(data: string, options: OptionValues) {
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

    try {
        await fs.writeFile(pathname, data);
        console.log(`done!\n Results writed to file ${pathname}`)
    }
    catch (err: any) {
        console.error(err);
        console.log(`done! But file output '${pathname}' cannot be written, check path?'`);
    }
}