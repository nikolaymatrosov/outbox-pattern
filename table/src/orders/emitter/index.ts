import { Driver, TokenAuthService } from 'ydb-sdk'
import { GetQueueUrlCommand, SendMessageCommand, SendMessageCommandInput, SQSClient } from '@aws-sdk/client-sqs';
import { GetQueueUrlCommandInput } from '@aws-sdk/client-sqs/dist-types/commands/GetQueueUrlCommand';
import { deleteOutboxMessage, getOutboxMessages } from './db'
import { logger } from '../../logger'


let endpoint = process.env.YDB_ENDPOINT;
let database = process.env.YDB_DATABASE;
let ymqName = process.env.YMQ_NAME;

// noinspection JSUnusedGlobalSymbols
export const handler = async (_: any, context: any) => {

    const authService = new TokenAuthService(context.token?.access_token ?? '');

    const driver = new Driver({ endpoint, database, authService });
    const timeout = 10000;
    if (!await driver.ready(timeout)) {
        logger.error(`Driver has not become ready in ${timeout}ms!`);
        return {
            statusCode: 500,
            body: 'Internal Server Error'
        }
    }

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

    // read outbox messages
    await driver.tableClient.withSession(async (session) => {
        while (true) {
            const txMeta = await session.beginTransaction({ serializableReadWrite: {} });
            const txId = txMeta.id as string;
            let message = await getOutboxMessages(session, logger, txId);

            if (message.length == 0) {
                break;
            }
            // send message to YMQ
            await client.send(new SendMessageCommand(sendMessageInput(
                JSON.stringify(message[0])
            )));
            // delete message from outbox
            await deleteOutboxMessage(session, message[0], logger, txId);
            // commit transaction
            await session.commitTransaction({ txId });
        }
    });

    return {
        statusCode: 200,
        body: 'OK'
    }

}

