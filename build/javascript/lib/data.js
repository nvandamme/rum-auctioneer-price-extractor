"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeData = exports.encodeData = exports.getData = exports.saveDB = exports.loadDB = void 0;
const cheerio = __importStar(require("cheerio"));
const got = require('got');
const fs_1 = require("fs");
const fs_2 = require("fs");
const path = __importStar(require("path"));
const commander_1 = require("commander");
const luxon_1 = require("luxon");
const intl_number_parser_1 = require("./intl-number-parser");
function loadDB() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield fs_1.promises.access('./db/data.json', fs_2.constants.R_OK);
        }
        catch (err) {
            return [];
        }
        let jsonDB = yield fs_1.promises.readFile('./db/data.json', { encoding: 'utf-8' });
        try {
            return JSON.parse(jsonDB);
        }
        catch (_a) {
            return [];
        }
    });
}
exports.loadDB = loadDB;
function saveDB(data) {
    return __awaiter(this, void 0, void 0, function* () {
        let jsonDB = JSON.stringify(data);
        try {
            yield fs_1.promises.access('./db', fs_2.constants.O_DIRECTORY | fs_2.constants.R_OK);
            yield fs_1.promises.writeFile('./db/data.json', jsonDB);
        }
        catch (err) {
            try {
                yield fs_1.promises.mkdir('./db');
                yield fs_1.promises.writeFile('./db/data.json', jsonDB);
            }
            catch (err) {
                throw err;
            }
        }
    });
}
exports.saveDB = saveDB;
function getData(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = `${options.url}?text=${options.input}&sort=${options.sort}&items_per_page=${options.items}`;
        const response = yield got(url);
        if (response.statusCode !== 200) {
            console.error('request failed');
        }
        else {
            console.log(`Got response from '${url}':`);
            const $ = cheerio.load(response.body);
            const lang = $('html').attr('lang');
            let numberParser;
            if (lang !== undefined)
                numberParser = new intl_number_parser_1.NumberParser(lang);
            let data = [];
            let db = yield loadDB();
            let dbHasChanges = false;
            $('div.views-row.producthomepage').each((i, product) => {
                const name = $(product).find('span.protitle').text().trim();
                const date_string = $(product).find('div.enddatein > span.uc-price').text().trim();
                const date = luxon_1.DateTime.fromFormat(date_string, 'dd.MM.yy');
                const price_string = $(product).find('span > span.uc-price').text().trim();
                let currency = "€";
                let price = 0;
                let raw_price = price_string.replace(/\s/gi, '');
                if (name != "" && date != null) {
                    if (isNaN(parseInt(raw_price[0])) === true) {
                        currency = raw_price[0];
                        if (lang) {
                            price = numberParser.parse(raw_price.substr(1));
                        }
                        else
                            price = parseFloat(raw_price.substr(1));
                    }
                    else if (isNaN(parseInt(raw_price[raw_price.length - 1])) === true) {
                        currency = raw_price[raw_price.length - 1];
                        if (lang) {
                            price = numberParser.parse(raw_price.substr(0, raw_price.length - 1));
                        }
                        else
                            price = parseFloat(raw_price.substr(0, raw_price.length - 1));
                    }
                    else {
                        if (lang) {
                            price = numberParser.parse(raw_price);
                        }
                        else
                            price = parseFloat(raw_price);
                    }
                    if (price != null && isNaN(price) != true) {
                        const extractedItem = {
                            name: name,
                            date: date,
                            price: price,
                            currency: currency,
                            raw_date: date_string,
                            raw_price: price_string
                        };
                        if (db.some(item => item.date === date && item.name === name) !== true) {
                            db.push(extractedItem);
                            dbHasChanges = true;
                        }
                        data.push(extractedItem);
                    }
                }
            });
            if (dbHasChanges) {
                yield saveDB(data);
            }
            return data;
        }
        return null;
    });
}
exports.getData = getData;
function encodeData(data, options) {
    return __awaiter(this, void 0, void 0, function* () {
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
            throw new commander_1.InvalidArgumentError(`Format output unknown: ${options.format}`);
        }
    });
}
exports.encodeData = encodeData;
function writeData(data, options) {
    return __awaiter(this, void 0, void 0, function* () {
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
            yield fs_1.promises.writeFile(pathname, data);
            console.log(`done!\n Results writed to file ${pathname}`);
        }
        catch (err) {
            console.error(err);
            console.log(`done! But file output '${pathname}' cannot be written, check path?'`);
        }
    });
}
exports.writeData = writeData;
//# sourceMappingURL=data.js.map