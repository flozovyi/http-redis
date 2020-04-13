import MessageBroker from "./MessageBroker";
import Message from "../interfaces/Message";
import FunctionMessage from "../interfaces/FunctionMessage";
import MessageBrokerOptions from "../interfaces/MessageBrokerOptions";

import {getCurrentUnixTimeGMT} from "../utils";
import * as IORedis from "ioredis";


export default class Redis extends MessageBroker {
    private _instance: any;
    private echo: FunctionMessage<Message> = async (message) => {
        console.log(`${message.time}: ${message.body}`)
    };
    public config: IORedis.RedisOptions;

    constructor(config: IORedis.RedisOptions) {
        super();
        this.setConfig(config);
    }

    public async init(config?: IORedis.RedisOptions) {
        if (config) this.setConfig(config);
        if (this._instance) return this._instance;
        this._instance = await new IORedis(this.config);
    }

    public async publish(queueName: string, message: Message) {
        const time = new Date(message.time).getTime();
        const tempName = `temp`;
        await this._instance.multi()
            .zadd(tempName, time, JSON.stringify(message))
            .zunionstore(queueName, 2, queueName, tempName)
            .zremrangebyscore(tempName, time - 1, time + 1)
            .exec();
        console.info(`${time}: ${JSON.stringify(message)} was added to queue`)
    }

    public async subscribe(queueName: string, handler?: FunctionMessage<Message>) {
        let _this = this;
        if (handler)
            this.setEchoHandler(handler);
        setInterval(() => {
            _this.fetchNewMessages.bind(_this, queueName)();
        }, 1000)
    }

    private setEchoHandler(handler: FunctionMessage<Message>) {
        this.echo = handler;
    }

    private async fetchNewMessages(queueName) {
        const now = getCurrentUnixTimeGMT();
        await this._instance
            .multi()
            .zrangebyscore(queueName, 0, now)
            .zremrangebyscore(queueName, 0, now)
            .exec((err, results) =>
                this.processFetchNewMessageResult.bind(this, err, results)());
        console.info(now, (new Date()).toString());
    }

    private async processFetchNewMessageResult(err, results) {
        if (!err && !results[0][0] && results[0][1]) {
            results[0][1].map(async el => {
                try {
                    const message: Message = JSON.parse(el);
                    await this.echo(message);
                } catch (err) {
                }
            })
        }
    }

    private async setConfig(config: MessageBrokerOptions) {
        if (config.echo) {
            this.setEchoHandler(config.echo);
            delete config.echo;
        }
        this.config = config;
    }
}