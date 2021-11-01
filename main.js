"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
var cheerio = require("cheerio");
var got = require('got');
var fs = require("fs");
var path = require("path");
var commander_1 = require("commander");
var luxon_1 = require("luxon");
var NumberParser = /** @class */ (function () {
    function NumberParser(locale) {
        this.parts = [];
        this.numerals = [];
        this.index = new Map();
        this.group = "";
        this.decimal = "";
        this.parts = new Intl.NumberFormat(locale).formatToParts(12345.6);
        this.numerals = __spreadArray([], __read(new Intl.NumberFormat(locale, { useGrouping: false }).format(9876543210)), false).reverse();
        this.index = new Map(this.numerals.map(function (d, i) { return [d, i]; }));
        var g = this.parts.find(function (d) { return d.type === "group"; });
        if (g !== undefined) {
            this.group = g.value;
        }
        this._group = new RegExp("[" + this.group + "]", "g");
        var d = this.parts.find(function (d) { return d.type === "decimal"; });
        if (d !== undefined) {
            this.decimal = d.value;
        }
        this._decimal = new RegExp("[" + this.decimal + "]");
        this._numerals = new RegExp("[" + this.numerals.join("") + "]", "g");
    }
    NumberParser.prototype.parse = function (string) {
        var _this = this;
        string = string.trim()
            .replace(this._group, "")
            .replace(this._decimal, ".")
            .replace(this._numerals, function (d) {
            var _a;
            var result = (_a = _this.index) === null || _a === void 0 ? void 0 : _a.get(d);
            if (result !== undefined)
                return result.toString();
            else
                return '';
        });
        return parseFloat(string);
    };
    return NumberParser;
}());
var program = new commander_1.Command();
function parseItemCount(value, prev) {
    var parsedValue = parseInt(value, 10);
    if (isNaN(parsedValue)) {
        throw new commander_1.InvalidArgumentError('Invalid number of items to extract.');
    }
    else if (parsedValue <= 0) {
        throw new commander_1.InvalidArgumentError('Number of items to extract is too low (< 1).');
    }
    else if (parsedValue >= 500) {
        throw new commander_1.InvalidArgumentError('Number of items to extract is too high (> 500).');
    }
    return parsedValue;
}
function extractData(options) {
    return __awaiter(this, void 0, void 0, function () {
        var outputBuffer, url, response, $_1, lang_1, numberParser_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    outputBuffer = 'name,date,full_price,price,currency\n';
                    url = options.url + "?text=" + options.input + "&sort=" + options.sort + "&items_per_page=" + options.items;
                    return [4 /*yield*/, got(url)];
                case 1:
                    response = _a.sent();
                    if (response.statusCode !== 200) {
                        console.error('request failed');
                    }
                    else {
                        //if (options.debug === true) 
                        //console.log(`Got response from '${url}':\n${response.body}`);
                        console.log("Got response from '" + url + "':");
                        $_1 = cheerio.load(response.body);
                        lang_1 = $_1('html').attr('lang');
                        if (lang_1 !== undefined)
                            numberParser_1 = new NumberParser(lang_1);
                        $_1('div.views-row.producthomepage').each(function (i, product) {
                            var name = $_1(product).find('span.protitle').text();
                            var date_string = $_1(product).find('div.enddatein > span.uc-price').text();
                            var date = luxon_1.DateTime.fromFormat(date_string, 'dd.MM.yy');
                            var price_string = $_1(product).find('span > span.uc-price').text().trim().replace(/\s/gi, '');
                            var currency = "€";
                            var price = 0;
                            //if (lang == 'en') {
                            //    price_string = price_string.replace(/,/gi,'');
                            //}
                            if (isNaN(parseInt(price_string[0])) === true) {
                                currency = price_string[0];
                                if (lang_1) {
                                    price = numberParser_1.parse(price_string.substr(1));
                                    price_string = "" + currency + price;
                                }
                                else
                                    price = parseFloat(price_string.substr(1));
                            }
                            else if (isNaN(parseInt(price_string[price_string.length - 1])) === true) {
                                currency = price_string[price_string.length - 1];
                                if (lang_1) {
                                    price = numberParser_1.parse(price_string.substr(0, price_string.length - 1));
                                    price_string = "" + price + currency;
                                }
                                else
                                    price = parseFloat(price_string.substr(0, price_string.length - 1));
                            }
                            else {
                                if (lang_1) {
                                    price = numberParser_1.parse(price_string);
                                    price_string = price.toString();
                                }
                                else
                                    price = parseFloat(price_string);
                            }
                            outputBuffer += "\"" + name + "\",\"" + date.toISODate() + "\"," + price_string + "," + price + ",\"" + currency + "\"\n";
                        });
                    }
                    return [2 /*return*/, outputBuffer];
            }
        });
    });
}
program
    .addOption(new commander_1.Option('-d, --debug', 'output extra debugging')["default"]('https://rumauctioneer.com/auction-search'))
    .addOption(new commander_1.Option('-u, --url <url>', 'url to parse')["default"]('https://rumauctioneer.com/auction-search'))
    .addOption(new commander_1.Option('-o, --output <filepath>', 'output to file'))
    .addOption(new commander_1.Option('-i, --input <keywords>', 'text input to search for').makeOptionMandatory(true))
    .addOption(new commander_1.Option('-n, --items <number>', 'number of items to extract').argParser(parseItemCount).choices(['20', '40', '100', '500'])["default"](500))
    .addOption(new commander_1.Option('-s, --sort <filter>', 'number of items to extract').choices(['field_reference_field_end_date+ASC', 'field_reference_field_end_date+DESC', 'search_api_relevance+ASC', 'search_api_relevance+DESC', 'auc_high_bid_amt+ASC', 'auc_high_bid_amt+DESC'])["default"]('field_reference_field_end_date+DESC', 'By End Date (recent)'))
    .showHelpAfterError();
program.parse();
var options = program.opts();
if (options.url !== undefined && options.items !== undefined && options.sort !== undefined) {
    extractData(options).then(function (data) {
        var filename = "";
        var dirname = "";
        var pathname = "";
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
            fs.writeFile(pathname, data, function (err) {
                if (err) {
                    console.error(err);
                    console.log("done! But file output '" + pathname + "' cannot be written, check path?'");
                }
                console.log("done!\n Results writed to file " + pathname);
            });
        }
        else {
            console.log("done! But file output '" + pathname + "' is not accesible, check path?'");
        }
    });
}
else if (options.help === true) {
    program.help();
}
else {
    console.error(new commander_1.InvalidArgumentError("Missing arguments (options:" + JSON.stringify(options) + ")"));
    program.help();
}
