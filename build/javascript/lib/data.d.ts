import { OptionValues } from 'commander';
import { DateTime } from "luxon";
export interface DataItem {
    name: string;
    date: DateTime;
    price: number;
    currency: string;
    raw_date: string;
    raw_price: string;
}
export declare type DataTable = Array<DataItem>;
export declare function loadDB(): Promise<DataTable>;
export declare function saveDB(data: DataTable): Promise<void>;
export declare function getData(options: OptionValues): Promise<DataTable | null>;
export declare function encodeData(data: DataTable, options: OptionValues): Promise<string>;
export declare function writeData(data: string, options: OptionValues): Promise<void>;
//# sourceMappingURL=data.d.ts.map