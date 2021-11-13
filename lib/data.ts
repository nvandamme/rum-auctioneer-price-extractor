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
    lot: number,
    vat: string,
    bid_open: boolean,
    name: string,
    date?: DateTime,
    price: number,
    currency: string,
    item_number?: number,
    product_image?: string,
    product_url?: string,
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

export async function getData(options: OptionValues, data:DataTable = [], current_page:number = 0, total_pages:number = -1) {
    const url = `${options.url}?text=${options.input}&sort=${options.sort}&items_per_page=${options.items}&page=${current_page}`;
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

        let db: DataTable = await loadDB();

        let dbHasChanges: boolean = false;

        if (total_pages == -1) {
            // https://rumauctioneer.com/auction-search?text=&sort=field_reference_field_end_date%20DESC&items_per_page=500&page=43
            total_pages = parseInt($('.pager-last a').attr('href')?.split('&page=')[1].split('&')[0] || "1");
            current_page = 0;
        }

        $('div.views-row.producthomepage').each((i, product) => {
            const lot_string = $(product).find('.lotnumber').text().toLowerCase().split('lot:').join('').trim();
            let lot: number = 0;
            let vat = 'uk';
            let vat_selector = $(product).find('.lot-vat');
            if ($(vat_selector.hasClass('vat-uk'))) vat = 'uk';
            else if ($(vat_selector.hasClass('vat-eu'))) vat = 'eu';
            else if ($(vat_selector.hasClass('vat-us'))) vat = 'us';
            const name = $(product).find('.protitle').text().trim();
            const date_string = $(product).find('.enddatein .uc-price').text().trim();
            const date = DateTime.fromFormat(date_string, 'dd.MM.yy');
            const price_string = $(product).find('.WinningBid .uc-price').text().trim();
            const product_image_string = $(product).find('.productimage img').attr('src')?.split('product_current').join('uc_product_full');
            const product_image = (product_image_string !== undefined) ? product_image_string : "";
            const product_url_string = $(product).find('a').attr('href');
            const product_url = (product_url_string !== undefined) ? product_url_string : "";
            let currency: string = "£";
            let price: number = 0;

            let raw_price = price_string.replace(/\s/gi, '');

            const bid_open = (date_string !== "" && date !== undefined && date !== null) ? false : true;

            const item_number_check = name.split('#');
            let item_number;

            if (item_number_check.length > 1) item_number = parseInt(item_number_check[1].split(' ')[0]);

            if (lot_string !== "") lot = parseInt(lot_string);

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

            const extractedItem: DataItem = {
                lot: lot,
                vat: vat,
                bid_open: bid_open,
                name: name,
                date: date,
                price: price,
                currency: currency,
                item_number: item_number,
                product_image: product_image,
                product_url: product_url,
                raw_date: date_string,
                raw_price: price_string
            }

            if (price != null && isNaN(price) != true && lot > 0) {

                // check if auction date for `lot` is not already extracted and add to json db
                let isNewRecord = true;
                for (let i = 0; i < db.length; i++) {
                    const item = db[i];
                    if (item.lot === lot) {
                        if (
                            (item.bid_open !== true && (item.date !== date || item.vat !== vat || item.price !== price)) || 
                            (item.bid_open === true && (item.price !== price || item.name !== name || item.vat !== vat)) ||
                            item.bid_open !== bid_open
                        ) {
                           item.price = price;
                           item.raw_price = price_string;
                           item.currency = currency;
                           item.vat = vat;
                           item.date = date;
                           item.raw_date = date_string;
                           item.name = name;
                           item.bid_open = bid_open;
                           item.item_number = item_number;
                           item.product_image = product_image;
                           item.product_url = product_url;
                           dbHasChanges = true;
                        }
                        isNewRecord = false;
                    }
                }
                if (isNewRecord === true) {
                    dbHasChanges = true;
                    db.push(extractedItem);
                }
                data.push(extractedItem);

            }
        });

        if (total_pages > 1 && (current_page+1) <= total_pages) {
            data = await getData(options, data, current_page+1, total_pages);
        }

        if (dbHasChanges) {
            await saveDB(data);
        }

        return data;
    }
    return [];
}

export async function encodeData(data: DataTable, options: OptionValues) {
    if (options.format === 'json') {
        return JSON.stringify(data);
    }
    else if (options.format === 'csv') {
        let outputBuffer = 'lot,bid_open,vat,name,date,price,currency,item_number,product_image,product_url,raw_date,raw_price\n';
        data.forEach(e => {
            outputBuffer += `${e.lot},${e.bid_open},${e.vat},"${e.name}","${e.date?.toISODate()}",${e.price},"${e.currency}",${e.item_number},${e.product_image},${e.product_url},"${e.raw_date}","${e.raw_price}"\n`;
        });
        return outputBuffer;
    }
    else {
        throw new InvalidArgumentError(`Format output unknown: ${options.format}`);
    }
}

export async function writeData(data: string, options: OptionValues) {
    let filename = (options.input === "") ? options.input : "data";
    let dirname = "";
    let pathname = "";

    if (options.output === undefined) {
        filename = filename
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