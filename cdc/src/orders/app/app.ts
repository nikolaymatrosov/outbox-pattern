import { Driver, TokenAuthService, } from 'ydb-sdk';
import { Order } from '../models'
import serverless from 'serverless-http'
import bodyParser from 'body-parser'
import * as express from 'express'
import { Request } from 'express'
import { createOrder, getOrderById, listOrders } from './db'
import { logger } from '../../logger'

const app = express.default();

app.use(bodyParser.json());

declare global {
    namespace Express {
        export interface Request {
            apiGateway: {
                context: {
                    driver: Driver
                }
            }
        }
    }
}

app.post('/orders', async (req, res) => {
    const orderData = req.body;
    const driver = req.apiGateway.context.driver;
    await driver.tableClient.withSession(async (session) => {
        const order = Order.create(orderData.orderId, orderData.customerId, new Date(), orderData.orderItems);
        try {
            await createOrder(session, order, logger);
            res.status(201).send({ message: 'Order created', orderId: order.orderId });
        } catch (e) {
            logger.error(e);
            res.status(500).send({ message: 'Internal Server Error' });
        }
    })

});

app.get('/orders', async (req: Request, res: express.Response) => {
    const driver = req.apiGateway.context.driver;
    await driver.tableClient.withSession(async (session) => {
        const orders = await listOrders(session, logger);
        res.send(orders.map((order: Order) => order.toJSON()));
    })
});

app.get('/order/:id', async (req, res) => {
    const id = req.params.id;
    const driver = req.apiGateway.context.driver;
    await driver.tableClient.withSession(async (session) => {
        const order = await getOrderById(session, id, logger);
        if (order) {
            res.send(order.toJSON());
        } else {
            res.status(404).send({ message: 'Order not found' });
        }
    })
});
let endpoint = process.env.YDB_ENDPOINT;
let database = process.env.YDB_DATABASE;
const wrapper = serverless(app);
// noinspection JSUnusedGlobalSymbols
export const handler = async (event: any, context: any) => {

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

    context.driver = driver;
    return wrapper(event, context);
}

