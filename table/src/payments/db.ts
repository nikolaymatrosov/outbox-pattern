import { Session, TypedValues } from 'ydb-sdk'
import { InboxMessage, IPayment } from './models'

const PAYMENTS_TABLE = '`payments/payments`';
const INBOX_TABLE = '`payments/inbox`';

export function tryToSaveIntoInbox(session: Session, messageId: string, message: any, createdAt: Date) {
    // check if message already exists in inbox
    const query = `
    DECLARE $id AS Utf8;
    DECLARE $message AS JsonDocument;
    DECLARE $created_at AS Timestamp;
    INSERT INTO ${INBOX_TABLE} (message_id, message, created_at) VALUES ($id, $message, $created_at);`;
    return session.executeQuery(query, {
        $id: TypedValues.utf8(messageId),
        $message: TypedValues.jsonDocument(JSON.stringify(message)),
        $created_at: TypedValues.timestamp(createdAt)
    });
}

export async function processTransactional(session: Session, messageId: string, process: (message: any, txId: string) => Promise<void>) {
    const select = `
    DECLARE $id AS Utf8;
    SELECT * FROM ${INBOX_TABLE} WHERE message_id = $id and processed_at is Null;`;
    const update = `
    DECLARE $id AS Utf8;
    DECLARE $processed_at AS Timestamp;
    UPDATE ${INBOX_TABLE} SET processed_at = $processed_at WHERE message_id = $id;`;
    const txMeta = await session.beginTransaction({ serializableReadWrite: {} });
    const txId = txMeta.id as string;
    const { resultSets } = await session.executeQuery(select, {
        $id: TypedValues.utf8(messageId)
    }, { txId });
    if (resultSets[0]?.rows?.length === 0 || !resultSets[0]?.rows) {
        await session.commitTransaction({ txId });
        return;
    }
    const inbox = InboxMessage.createNativeObjects(resultSets[0]);
    const message = inbox[0];
    try {
        await process(message, txId);
        await session.executeQuery(update, {
            $id: TypedValues.utf8(messageId),
            $processed_at: TypedValues.timestamp(new Date())
        }, { txId });
        await session.commitTransaction({ txId });
    } catch (e) {
        await session.rollbackTransaction({ txId });
        throw e;
    }
}


export async function insertPayment(session: Session, payment: IPayment, txId?: string) {
    const txControl = txId ? { txId } : undefined;
    const query = `
    DECLARE $paymentId AS Utf8;
    DECLARE $orderId AS Utf8;
    DECLARE $amount AS Uint64;
    DECLARE $paymentDate AS Timestamp;
    INSERT INTO ${PAYMENTS_TABLE} (payment_id, order_id, amount, payment_date) VALUES ($paymentId, $orderId, $amount, $paymentDate);`;
    return session.executeQuery(query, {
        $paymentId: TypedValues.utf8(payment.paymentId),
        $orderId: TypedValues.utf8(payment.orderId),
        $amount: TypedValues.uint64(payment.amount),
        $paymentDate: TypedValues.timestamp(payment.paymentDate)
    }, txControl);
}
