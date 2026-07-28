import { startRedemptionConsumer } from "./redemption.consumer";

export async function startAllConsumers() {
    await startRedemptionConsumer();
    console.log("All redemption service consumers started 🚀");
}
