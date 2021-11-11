import { OptionValues } from 'commander'
import fastify from 'fastify'

export const server = fastify()

server.get('/', async (request, reply) => {
    return 'pong\n'
})

export async function launchServer(options?: OptionValues) {
    if (options === undefined) {
        options = {
            port: 8080
        }
    }
    else if (options.port == undefined) {
        options.port = 8080;
    }
    server.listen(options.port, (err, address) => {
        if (err) {
            console.error(err)
            process.exit(1)
        }
        console.log(`Server listening at ${address}`)
    })
}

if (require.main !== undefined && require.main === module) {
    launchServer();
}