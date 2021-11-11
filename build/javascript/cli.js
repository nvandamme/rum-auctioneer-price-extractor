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
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const data_1 = require("./lib/data");
const server_1 = require("./server");
const program = new commander_1.Command();
program
    .command('get')
    .addOption(new commander_1.Option('-d, --debug', 'output extra debugging').default('https://rumauctioneer.com/auction-search'))
    .addOption(new commander_1.Option('-u, --url <url>', 'url to parse').default('https://rumauctioneer.com/auction-search'))
    .addOption(new commander_1.Option('-o, --output <filepath>', 'output to file'))
    .addOption(new commander_1.Option('-i, --input <keywords>', 'text input to search for').makeOptionMandatory(true))
    .addOption(new commander_1.Option('-n, --items <number>', 'number of items to extract').argParser((value, prev) => {
    const parsedValue = parseInt(value, 10);
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
}).choices(['20', '40', '100', '500']).default(500))
    .addOption(new commander_1.Option('-s, --sort <sortFilter>', 'number of items to extract').choices(['field_reference_field_end_date+ASC', 'field_reference_field_end_date+DESC', 'search_api_relevance+ASC', 'search_api_relevance+DESC', 'auc_high_bid_amt+ASC', 'auc_high_bid_amt+DESC']).default('field_reference_field_end_date+DESC', 'By End Date (recent)'))
    .addOption(new commander_1.Option('-f, --format <formatFilter>', 'file format to output').choices(['csv', 'json']).default('csv'))
    .action((options, command) => {
    if (options.url !== undefined && options.items !== undefined && options.sort !== undefined) {
        (0, data_1.getData)(options)
            .then((data) => (0, data_1.encodeData)(data, options))
            .then((data) => (0, data_1.writeData)(data, options));
    }
    else if (options.help === true) {
        program.help();
    }
    else {
        console.error(new commander_1.InvalidArgumentError(`Missing arguments (options:${JSON.stringify(options)})`));
        program.help();
    }
});
program
    .command('serve')
    .addOption(new commander_1.Option('-p --port <port>', 'launch server on port').default(8080))
    .action((options, command) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, server_1.launchServer)(options);
}))
    .showHelpAfterError();
program.parse();
//# sourceMappingURL=cli.js.map