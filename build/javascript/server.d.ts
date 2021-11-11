/// <reference types="node" />
import { OptionValues } from 'commander';
export declare const server: import("fastify").FastifyInstance<import("http").Server, import("http").IncomingMessage, import("http").ServerResponse, import("fastify").FastifyLoggerInstance> & PromiseLike<import("fastify").FastifyInstance<import("http").Server, import("http").IncomingMessage, import("http").ServerResponse, import("fastify").FastifyLoggerInstance>>;
export declare function launchServer(options?: OptionValues): Promise<void>;
//# sourceMappingURL=server.d.ts.map