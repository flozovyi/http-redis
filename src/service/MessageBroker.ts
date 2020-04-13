import Message from '../interfaces/Message';

export default abstract class MessageBroker {

    abstract init();

    abstract publish(queueName: string, message: Message);

    abstract subscribe(queueName: string, handler: Function);
}