import * as amqp from "amqplib";
import * as dotenv from 'dotenv'
import { BrokerResponse, CreateExchangeRequest, CustomErrorRabbitMq, PublishRequest } from "../../../types";
dotenv.config()
export class Broker {
    private connection: amqp.ChannelModel | undefined;
    private channel: amqp.Channel | undefined;
    constructor() {
        if (!this.connection) {
            this.createRabbitMqConnection();
        }
    }
    private async _init_(): Promise<void | CustomErrorRabbitMq> {
        try {
            if (!this.connection) {
                await this.createRabbitMqConnection();
            }
            this.channel = await this.connection!.createChannel();

        } catch (error) {

            const initialization_error: CustomErrorRabbitMq = new CustomErrorRabbitMq(
                (error as CustomErrorRabbitMq)?.name || 'Class Broker - _init_ Function - RABBIT_MQ_ERROR',
                (error as CustomErrorRabbitMq)?.message || 'Error in initialization Method of Broker Class',
                false
            );
            throw initialization_error;
        }
    }


    private async createRabbitMqConnection(): Promise<void | CustomErrorRabbitMq> {
        try {
            console.log(`amqp://${process.env.BROKER_USERNAME}:${process.env.BROKER_PASSWORD}@${process.env.BROKER_IP}`)
            this.connection = await amqp.connect(
                //`amqp://${process.env.BROKER_USERNAME}:${process.env.BROKER_PASSWORD}@${process.env.BROKER_IP}`,
                `amqp://${process.env.BROKER_USERNAME}:${process.env.BROKER_PASSWORD}@${process.env.BROKER_IP}`,
                //'amqp://localhost',
                "heartbeat=60"
            );
        } catch (error) {
            console.log(error);
            const connection_error: CustomErrorRabbitMq = new CustomErrorRabbitMq(
                (error as CustomErrorRabbitMq)?.name || 'Class Broker - createRabbitMqConnection Function - RABBIT_MQ_ERROR',
                (error as CustomErrorRabbitMq)?.message || 'Error in creating Rabbit MQ Connection',
                false);
            throw connection_error;

        }
    }
    private async createExchange(request: CreateExchangeRequest): Promise<CustomErrorRabbitMq | Broker> {
        try {
            // let validateRequestBody = CreateExchangeRequestBodyScheme.validate(request);
            // if (validateRequestBody.error) {
            //     const error: CustomErrorRabbitMq = new CustomErrorRabbitMq("Class Broker - createExchange Function - REQUEST_BODY_VALIDATION_ERROR", validateRequestBody.error?.details[0]?.message || "Something went wrong in input paramters validation in create Exchange method of broker class. Please try again", false);
            //     throw error;
            // }
            const name = request.name; const type = request.type;
            if (!this.connection) {
                await this._init_();
            }
            if (!this.channel) {
                const error: CustomErrorRabbitMq = new CustomErrorRabbitMq('RABBIT_MQ_ERROR', 'Class Broker - createExchange Function - Channel not initialized', false);
                throw error;
            }
            await this.channel.assertExchange(name, type, { durable: true });
            return this;
        } catch (error) {
            const initialization_error: CustomErrorRabbitMq = new CustomErrorRabbitMq((error as CustomErrorRabbitMq)?.name || 'Class Broker - createExchange Function - RABBIT_MQ_ERROR', (error as CustomErrorRabbitMq)?.message || 'Error in Create Exchange Method of Broker Class', false);
            throw initialization_error;
        }
    }
    private async disconnect(): Promise<void | CustomErrorRabbitMq> {
        try {
            // if (this.channel) {
            //     await this.channel.close();
            //     this.channel = undefined;
            // }
            if (this.connection) {
                await this.connection.close();
                this.connection = undefined;
            }
        } catch (error) {
            const disconnect_error: CustomErrorRabbitMq = new CustomErrorRabbitMq((error as CustomErrorRabbitMq)?.name || 'Class Broker - disconnect Function - RABBIT_MQ_ERROR', (error as CustomErrorRabbitMq)?.message || 'Error in Disconnect Method of Broker Class', false);
            throw disconnect_error;
        }
    }
    public async publish(request: PublishRequest): Promise<CustomErrorRabbitMq | BrokerResponse> {
        try {
            // let validateRequestBody = sendCommunicationRequestBodyScheme.validate(request);
            // if (validateRequestBody.error) {
            //     const error: CustomErrorRabbitMq = new CustomErrorRabbitMq("Class Broker - publish Function - REQUEST_BODY_VALIDATION_ERROR", validateRequestBody.error?.details[0]?.message || "Something went wrong in input paramters validation in publish method of broker class. Please try again", false);
            //     throw error;
            // }
            const exchange = request.exchange; const message = request.payload; const binding_key = request.binding_key; const type = request.type;
            if (!this.connection) {
                await this._init_();
            }
            //const transactionID = `xuriti_rabbit_log_${Math.floor(1000 + Math.random() * 9000)}`;
            //message.transaction_id = transactionID;
            const createExchangeData: CreateExchangeRequest = new CreateExchangeRequest(exchange, type);
            await this.createExchange(createExchangeData);
            await this.channel!.publish(exchange, binding_key, Buffer.from(JSON.stringify(message)));

            // const logResult = await log(message, transactionID, null, "publish", "email", false);
            // console.log(logResult);

            // console.log(
            //     `Published message in exchange: ${exchange} \n with binding key: ${binding_key} \n and type: ${type} \n with message: ${JSON.stringify(message)} \n`
            // );

            setTimeout(() => {
                this.disconnect();
                // this.channel.close();
                console.log("<=====RabbitMQ connection closed=====>");
            }, 1000);

            const CustomResponse: BrokerResponse = { message: "Sent Message successfully", status: true, transactionId: '' };
            return CustomResponse;
        } catch (error) {
            console.log("publish catch block", error);
            const publish_error: CustomErrorRabbitMq = new CustomErrorRabbitMq((error as CustomErrorRabbitMq)?.name || 'Class Broker - publish Function - RABBIT_MQ_ERROR', (error as CustomErrorRabbitMq)?.message || 'Error in Publish Method of Broker Class', false);
            return publish_error;
        }
    }
}
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Application-specific logging, throwing an error, or other logic here
});
