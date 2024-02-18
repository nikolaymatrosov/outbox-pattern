import { Session, TypedValues } from 'ydb-sdk'
import { OUTBOX_TABLE, OutboxMessage } from '../models'
import winston from 'winston'

export async function getOutboxMessages(session: Session, logger: winston.Logger, txId: string) {
    const query = `
    SELECT * FROM ${OUTBOX_TABLE}
    LIMIT 1;`;
    logger.info('Listing outbox messages...');
    const { resultSets } = await session.executeQuery(query, {}, { txId });
    return OutboxMessage.createNativeObjects(resultSets[0]) as OutboxMessage[];
}

export function deleteOutboxMessage(session: Session, outboxMessage: OutboxMessage, logger: winston.Logger, txId: string) {
    const query = `
    DECLARE $id AS Utf8;
    DELETE FROM ${OUTBOX_TABLE}
    WHERE message_id = $id;`;
    logger.info('Deleting outbox message...');
    return session.executeQuery(query, {
        $id: TypedValues.utf8(outboxMessage.messageId)
    }, { txId });
}
