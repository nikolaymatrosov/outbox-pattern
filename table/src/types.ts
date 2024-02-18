export interface IDomainEvent {
    eventType: string;
    event: object;
}

export interface OrderItem {
    productId: string;
    quantity: number;
    price: number;
}

export interface IOrderCreatedEvent extends IDomainEvent {
    eventType: 'OrderCreated';
    event: {
        orderId: string;
        customerId: string;
        orderDate: Date;
        orderItems: OrderItem[];
    }
}

export interface IOutboxMessage {
    messageId: string;
    message: string;
    created: Date;
}
