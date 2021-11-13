import { Command, InvalidArgumentError, Option, OptionValues } from 'commander';
import { getData, encodeData, writeData, DataTable } from "./lib/data";
import { launchServer } from './server';

const program = new Command(); //.makeOptionMandatory(true))

program
    .command('get')
    .addOption(new Option('-d, --debug', 'output extra debugging'))
    .addOption(new Option('-u, --url <url>', 'url to parse').default('https://rumauctioneer.com/auction-search'))
    .addOption(new Option('-o, --output <filepath>', 'output to file'))
    .addOption(new Option('-i, --input <keywords>', 'text input to search for').default(""))
    .addOption(new Option('-n, --items <number>', 'number of items to extract').argParser<number>(
        (value: string, prev: number) => {
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
    ).choices(['20', '40', '100', '500']).default(500))
    .addOption(new Option('-s, --sort <sortFilter>', 'number of items to extract').choices(['field_reference_field_end_date+ASC', 'field_reference_field_end_date+DESC', 'search_api_relevance+ASC', 'search_api_relevance+DESC', 'auc_high_bid_amt+ASC', 'auc_high_bid_amt+DESC']).default('field_reference_field_end_date+DESC', 'By End Date (recent)'))
    .addOption(new Option('-f, --format <formatFilter>', 'file format to output').choices(['csv', 'json']).default('csv'))
    .action((options, command) => {
        if (options.url !== undefined && options.items !== undefined && options.sort !== undefined) {
            getData(options)
                .then((data) => encodeData(data as DataTable, options))
                .then((data) => writeData(data, options));
        }
        else if (options.help === true) {
            program.help();
        }
        else {
            console.error(new InvalidArgumentError(`Missing arguments (options:${JSON.stringify(options)})`));
            program.help();
        }
    })

program
    .command('serve')
    .addOption(new Option('-p --port <port>', 'launch server on port').default(8080))
    .action(async (options, command) => {
        await launchServer(options);
    })
    .showHelpAfterError()
    ;

program.parse();