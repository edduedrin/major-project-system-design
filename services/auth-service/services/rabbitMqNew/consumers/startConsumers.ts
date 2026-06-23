import { startNotificationConsumer } from "./notification.consumer";
import { startNotificationUserConsumer } from "./notification.user.consumer";
import { startQrConsumer } from "./qr.consumer";
import { startQrPdfConsumer } from "./qrPdf.consumer";

export async function startAllConsumers() {
    await startNotificationConsumer();
    await startNotificationUserConsumer();
    await startQrConsumer();
    await startQrPdfConsumer();

    console.log("All consumers started 🚀");
}