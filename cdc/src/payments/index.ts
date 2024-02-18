import { Driver, TokenAuthService, YdbError } from 'ydb-sdk'
import { logger } from '../logger'
import { insertPayment, processTransactional, tryToSaveIntoInbox } from './db'
import { MessageQueue } from '@yandex-cloud/function-types/dist/src/triggers'
import { IDomainEvent, IOrderCreatedEvent, IDbOutboxMessage } from '../types'
import { randomUUID } from 'node:crypto'
import { InboxMessage } from './models'

let endpoint = process.env.YDB_ENDPOINT;
let database = process.env.YDB_DATABASE;

export async function handler(event: MessageQueue.Event, context: any) {
    const authService = new TokenAuthService(context.token?.access_token ?? '');

    logger.info('event', { event })
    let inbox = JSON.parse(event.messages[0].details.message.body) as IDbOutboxMessage;
    const driver = new Driver({ endpoint, database, authService });
    const timeout = 10000;
    if (!await driver.ready(timeout)) {
        logger.error(`Driver has not become ready in ${timeout}ms!`);
        return {
            statusCode: 500,
            body: 'Internal Server Error'
        }
    }
    await driver.tableClient.withSession(async (session) => {
        // Check if message already exists in inbox
        try {
            await tryToSaveIntoInbox(session, inbox.messageId, inbox.message, new Date());
        } catch (e) {
            if (e instanceof YdbError) {
                if (e.issues?.find(issue => issue.message === 'Conflict with existing key.')) {
                    logger.warn(`Message with id ${inbox.messageId} is already processed`);
                    return {
                        statusCode: 200,
                        body: 'Duplicate message'
                    }
                }
                throw e;
            }
        }
        // Process message and mark it as processed
        return await processTransactional(session, inbox.messageId, async (inbox: InboxMessage, txId: string) => {
            logger.info('Processing event', { event: inbox });
            const event = inbox.toJSON().message as IDomainEvent
            if (event.eventType === 'OrderCreated') {
                const orderCreatedEvent = (event as IOrderCreatedEvent).event;
                const payment = {
                    paymentId: randomUUID(),
                    orderId: orderCreatedEvent.orderId,
                    amount: orderCreatedEvent.orderItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
                    paymentDate: new Date()
                };
                await insertPayment(session, payment, txId);
            }
        });

    });
    await driver.destroy();
    return {
        statusCode: 200,
        body: 'OK'
    }
}

