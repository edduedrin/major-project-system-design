var amqp = require('amqplib/callback_api');
import * as dotenv from 'dotenv';
import { qrController } from '../../../controllers';

dotenv.config();

const exchange = 'qrPdfExchange';
const bindingKey = 'relaxwell';

export async function startQrPdfConsumer() {
    try {
        amqp.connect(
            `amqp://${process.env.BROKER_USERNAME}:${process.env.BROKER_PASSWORD}@${process.env.BROKER_IP}`,
            (error0: any, connection: any) => {

                if (error0) {
                    console.error("❌ Connection error:", error0);
                    process.exit(1);
                }

                console.log("✅ Connected to RabbitMQ (PDF Consumer)");

                connection.createChannel((error1: any, channel: any) => {

                    if (error1) {
                        console.error("❌ Channel creation error:", error1);
                        process.exit(1);
                    }

                    console.log("✅ Channel created");

                    // 🔥 IMPORTANT — Only ONE message at a time
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

                            channel.bindQueue(q.queue, exchange, bindingKey);

                            console.log(` [*] Waiting for PDF jobs with binding key: ${bindingKey}`);

                            channel.consume(
                                q.queue,
                                async (msg: any) => {

                                    if (!msg) return;

                                    try {
                                        console.log("📄 Processing PDF job...");

                                        const stringMessage = msg.content.toString();
                                        const jsonObject = JSON.parse(stringMessage);

                                        await qrController.generateQrPdf(jsonObject);

                                        // ✅ ACK only after success
                                        channel.ack(msg);

                                        console.log("✅ PDF job completed");

                                    } catch (error) {
                                        console.error("❌ PDF generation failed:", error);

                                        // ❌ Reject without requeue (avoid infinite loop)
                                        channel.nack(msg, false, false);
                                    }
                                },
                                { noAck: false } // 🔥 must be false
                            );
                        });
                    });
                });
            }
        );

    } catch (error) {
        console.error("Unexpected error:", error);
    }
}

startQrPdfConsumer();