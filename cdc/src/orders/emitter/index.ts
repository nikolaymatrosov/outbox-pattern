import { logger } from '../../logger'
import { IOrderCreatedEvent, OutboxMessage } from '../../types'
import {
    GetQueueUrlCommand,
    GetQueueUrlCommandInput,
    SendMessageCommand,
    SendMessageCommandInput,
    SQSClient
} from '@aws-sdk/client-sqs'


let ymqName = process.env.YMQ_NAME;

interface CdcEvent {
    'messages': OutboxCdcMessage[]
}

interface OutboxCdcMessage {
    'key': [string],
    'newImage': OutboxMessage<IOrderCreatedEvent>,
    'update': object,
}

// noinspection JSUnusedGlobalSymbols
export const handler = async (event: CdcEvent, _: any) => {
    logger.info('event', { event })


    const client = new SQSClient({
        region: 'ru-central1',
        signingRegion: 'ru-central1',
        endpoint: 'https://message-queue.api.cloud.yandex.net'

    });

    const getQueueCmd: GetQueueUrlCommandInput = {
        QueueName: ymqName,
    };

    const urlRes = await client.send(new GetQueueUrlCommand(getQueueCmd));

    // Set the parameters
    const sendMessageInput = (data: string): SendMessageCommandInput => {
        return ({
            MessageBody: data,
            QueueUrl: urlRes.QueueUrl,
        })
    };

    const data = {
        messageId: event.messages[0].key[0],
        ...event.messages[0].newImage
    }

    await client.send(new SendMessageCommand(sendMessageInput(JSON.stringify(data))));

    return {
        statusCode: 200,
        body: 'OK'
    }

}

