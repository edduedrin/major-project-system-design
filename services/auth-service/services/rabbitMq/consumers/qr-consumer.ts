import amqp from 'amqplib/callback_api';
import * as dotenv from 'dotenv';
import { qrController } from '../../../controllers';

dotenv.config();

const exchange = 'qrExchange';
const bindingKey = 'relaxwell';

export async function startQrConsumer() {
    try {
        amqp.connect(
            `amqp://${process.env.BROKER_USERNAME}:${process.env.BROKER_PASSWORD}@${process.env.BROKER_IP}`,
            (error0: any, connection: any) => {

                if (error0) {
                    console.error("❌ RabbitMQ Connection error:", error0);
                    process.exit(1);
                }

                console.log("✅ Connected to RabbitMQ");

                connection.createChannel((error1: any, channel: any) => {

                    if (error1) {
                        console.error("❌ Channel creation error:", error1);
                        process.exit(1);
                    }

                    console.log("✅ Channel created");

                    // 🔥 IMPORTANT: Only process ONE message at a time
                    channel.prefetch(1);

                    channel.assertExchange(exchange, 'direct', { durable: true }, (error2: any) => {
                        if (error2) {
                            console.error("❌ Exchange assertion error:", error2);
                            process.exit(1);
                        }

                        channel.assertQueue('', { exclusive: true }, (error3: any, q: any) => {

                            if (error3) {
                                console.error("❌ Queue assertion error:", error3);
                                process.exit(1);
                            }

                            channel.bindQueue(q.queue, exchange, bindingKey, {}, (error4: any) => {
                                if (error4) {
                                    console.error("❌ Queue binding error:", error4);
                                    process.exit(1);
                                }
                            });

                            console.log(` [*] Waiting for messages with binding key: ${bindingKey}`);

                            channel.consume(
                                q.queue,
                                async (msg: any) => {
                                    if (!msg) return;

                                    try {
                                        console.log("📥 Received message");

                                        const stringMessage = msg.content.toString();
                                        const jsonObject = JSON.parse(stringMessage);

                                        await qrController.generateQr(jsonObject);

                                        // ✅ Acknowledge only after success
                                        channel.ack(msg);

                                        console.log("✅ Message processed successfully");

                                    } catch (error) {
                                        console.error("❌ Processing failed:", error);

                                        // ❌ Reject message (no requeue to avoid infinite retry)
                                        channel.nack(msg, false, false);
                                    }
                                },
                                {
                                    noAck: false // 🔥 MUST be false for manual ack
                                }
                            );
                        });
                    });
                });
            }
        );

    } catch (error) {
        console.error("Unexpected error in consumer:", error);
    }
}

// Automatically start consumer
startQrConsumer();