import { declareType, snakeToCamelCaseConversion, TypedData, Types, withTypeOptions } from 'ydb-sdk';
import { randomUUID } from 'node:crypto'
import { IDomainEvent, IOrderCreatedEvent, IOutboxMessage, OrderItem } from '../types'

export interface IOrder {
    orderId: string;
    customerId: string;
    orderDate: Date;
    orderItems: string;
}

@withTypeOptions({ namesConversion: snakeToCamelCaseConversion })
export class Order extends TypedData {
    @declareType(Types.UTF8)
    public orderId: string;

    @declareType(Types.UTF8)
    public customerId: string;

    @declareType(Types.TIMESTAMP)
    public orderDate: Date;

    @declareType(Types.JSON_DOCUMENT)
    public orderItems: string;

    private _outboxMessages: OutboxMessage[] = [];

    static create(orderId: string, customerId: string, orderDate: Date, orderItems: OrderItem[]): Order {
        const orderCreatedEvent: IOrderCreatedEvent = {
            eventType: 'OrderCreated',
            event: {
                orderId,
                customerId,
                orderDate,
                orderItems
            }
        };

        const model = new this({ orderId, customerId, orderDate, orderItems: JSON.stringify(orderItems ?? []) });
        model._outboxMessages = [OutboxMessage.create(randomUUID(), orderCreatedEvent, new Date())];
        return model;
    }

    constructor(data: IOrder) {
        super(data);
        this.orderId = data.orderId;
        this.customerId = data.customerId;
        this.orderDate = data.orderDate;
        this.orderItems = data.orderItems;
    }


    public get outboxMessages(): OutboxMessage[] {
        return this._outboxMessages;
    }

    public toJSON(): object {
        return {
            orderId: this.orderId,
            customerId: this.customerId,
            orderDate: this.orderDate,
            orderItems: JSON.parse(this.orderItems)
        };
    }
}

@withTypeOptions({ namesConversion: snakeToCamelCaseConversion })
export class OutboxMessage extends TypedData {
    @declareType(Types.UTF8)
    public messageId: string;

    @declareType(Types.JSON_DOCUMENT)
    public message: string;

    @declareType(Types.TIMESTAMP)
    public created: Date;

    static create(messageId: string, message: IDomainEvent, created: Date): OutboxMessage {
        return new this({ messageId, message: JSON.stringify(message), created });
    }

    constructor(data: IOutboxMessage) {
        super(data);
        this.messageId = data.messageId;
        this.message = data.message;
        this.created = data.created;
    }

    public toJSON(): object {
        return {
            messageId: this.messageId,
            message: JSON.parse(this.message),
            created: this.created
        };
    }
}

export const ORDERS_TABLE = '`orders/orders`';
export const OUTBOX_TABLE = '`orders/outbox`';
