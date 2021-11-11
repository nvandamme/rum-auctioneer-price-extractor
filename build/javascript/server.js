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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.launchServer = exports.server = void 0;
const fastify_1 = __importDefault(require("fastify"));
exports.server = (0, fastify_1.default)();
exports.server.get('/', (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
    return 'pong\n';
}));
function launchServer(options) {
    return __awaiter(this, void 0, void 0, function* () {
        if (options === undefined) {
            options = {
                port: 8080
            };
        }
        else if (options.port == undefined) {
            options.port = 8080;
        }
        exports.server.listen(options.port, (err, address) => {
            if (err) {
                console.error(err);
                process.exit(1);
            }
            console.log(`Server listening at ${address}`);
        });
    });
}
exports.launchServer = launchServer;
if (require.main !== undefined && require.main === module) {
    launchServer();
}
//# sourceMappingURL=server.js.map