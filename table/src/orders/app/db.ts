import { Session, TypedValues, Ydb } from 'ydb-sdk'
import winston from 'winston'
import { Order, ORDERS_TABLE, OUTBOX_TABLE, OutboxMessage } from '../models'
import ExecuteQueryResult = Ydb.Table.ExecuteQueryResult

export async function createOrder(session: Session, order: Order, logger: winston.Logger): Promise<ExecuteQueryResult> {
    const query = `
DECLARE $orderData AS List<Struct<order_id: Utf8, customer_id: Utf8, order_date: Timestamp, order_items: JsonDocument>>;
DECLARE $outboxData AS List<Struct<message_id: Utf8, message: JsonDocument, created: Timestamp>>;
INSERT INTO ${ORDERS_TABLE} (order_id, customer_id, order_date, order_items) SELECT
    order_id, customer_id, order_date, order_items
FROM AS_TABLE ($orderData);
INSERT INTO ${OUTBOX_TABLE} (message_id, message, created) SELECT
    message_id, message, created
FROM AS_TABLE($outboxData);
`;
    logger.info('Creating order...');
    return session.executeQuery(query, {
        $orderData: Order.asTypedCollection([order]),
        $outboxData: OutboxMessage.asTypedCollection(order.outboxMessages)
    })
}

export async function listOrders(session: Session, logger: winston.Logger): Promise<Order[]> {
    const query = `
SELECT * FROM ${ORDERS_TABLE};`;
    logger.info('Listing orders...');

    const { resultSets } = await session.executeQuery(query);

    return Order.createNativeObjects(resultSets[0]) as Order[];
}

export async function getOrderById(session: Session, id: string, logger: winston.Logger): Promise<Order | null> {
    const query = `
DECLARE $id AS Utf8;
SELECT * FROM ${ORDERS_TABLE} WHERE orderId = $id;`;
    logger.info('Getting order by id...');

    const { resultSets } = await session.executeQuery(query, {
        $id: TypedValues.utf8(id)
    });

    const orders = Order.createNativeObjects(resultSets[0]) as Order[];
    return orders.length > 0 ? orders[0] : null;
}
