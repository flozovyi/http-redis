import {Server} from './api/Server';
import Redis from "./service/Redis";
import redisConfig from "./config/redisConfig";

(async () => {
    const server = new Server({port: 3000});
    await server.start()
    const mq = new Redis(redisConfig);
    await mq.init();
    await mq.subscribe('messages', async <FunctionMessage>(message) => {
        console.log(message, '---');
    })
})()