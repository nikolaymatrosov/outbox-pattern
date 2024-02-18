import { declareType, snakeToCamelCaseConversion, TypedData, Types, withTypeOptions } from 'ydb-sdk';

interface IInboxMessage {
    messageId: string;
    message: string;
    createdAt: Date;
    processedAt: Date | null;
}

@withTypeOptions({ namesConversion: snakeToCamelCaseConversion })
export class InboxMessage extends TypedData {
    @declareType(Types.UTF8)
    public messageId: string;

    @declareType(Types.JSON_DOCUMENT)
    public message: string;

    @declareType(Types.TIMESTAMP)
    public createdAt: Date;

    @declareType(Types.TIMESTAMP)
    public processedAt: Date | null;

    constructor(data: IInboxMessage) {
        super(data);
        this.messageId = data.messageId;
        this.message = data.message;
        this.createdAt = data.createdAt;
        this.processedAt = data.processedAt;
    }

    public toJSON() {
        return {
            messageId: this.messageId,
            message: JSON.parse(this.message),
            createdAt: this.createdAt,
            processedAt: this.processedAt
        };
    }
}


export interface IPayment {
    paymentId: string;
    orderId: string;
    amount: number;
    paymentDate: Date;
}

@withTypeOptions({ namesConversion: snakeToCamelCaseConversion })
export class Payment extends TypedData {
    @declareType(Types.UTF8)
    public paymentId: string;

    @declareType(Types.UTF8)
    public orderId: string;

    @declareType(Types.UINT64)
    public amount: number;

    @declareType(Types.TIMESTAMP)
    public paymentDate: Date;

    constructor(data: IPayment) {
        super(data);
        this.paymentId = data.paymentId;
        this.orderId = data.orderId;
        this.amount = data.amount;
        this.paymentDate = data.paymentDate;
    }

    public toJSON() {
        return {
            paymentId: this.paymentId,
            orderId: this.orderId,
            amount: this.amount,
            paymentDate: this.paymentDate
        };
    }
}
