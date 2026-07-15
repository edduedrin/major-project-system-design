import { startQrConsumer, startQrPdfConsumer } from "./qr.consumer";

export async function startAllConsumers() {
    await startQrConsumer();
    await startQrPdfConsumer();

    console.log("All consumers started 🚀");
}
