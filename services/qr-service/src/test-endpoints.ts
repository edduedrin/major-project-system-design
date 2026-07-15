import axios from "axios";
import jwt from "jsonwebtoken";

const BASE_URL = "http://localhost:3002";

async function runTests() {
  console.log("=== Starting QR Service Endpoint Tests ===\n");

  try {
    // 1. Health Check
    console.log("1. Testing Health Check...");
    const healthRes = await axios.get(`${BASE_URL}/health`);
    console.log(`Status: ${healthRes.status}, Response:`, healthRes.data);
    console.log("-------------------------------------------\n");

    // 2. Generate Serial Numbers
    console.log("2. Testing Code Generation...");
    const genRes = await axios.post(`${BASE_URL}/qr/generate`, {
      productId: "PRD-MOCK-101",
      productName: "Premium Smartwatch",
      quantity: 3,
    });
    const genData: any = genRes.data;
    console.log(`Status: ${genRes.status}`);
    if (genData.success && genData.data) {
      console.log(`Generated ${genData.data.length} codes successfully.`);
      console.log("First generated code preview:");
      console.log(`- ID: ${genData.data[0].id}`);
      console.log(`- Serial Number: ${genData.data[0].serialNumber}`);
      console.log(`- QR Code Base64 Data URL (truncated): ${genData.data[0].qrCodeUrl.substring(0, 50)}...`);
    } else {
      console.log("Error generating codes:", genData);
    }
    console.log("-------------------------------------------\n");

    if (!genData.success || !genData.data || genData.data.length === 0) {
      throw new Error("Generation failed, stopping tests.");
    }

    const testCode = genData.data[0].serialNumber;
    const testCode2 = genData.data[1].serialNumber;

    // 3. Fetch Codes
    console.log("3. Testing Fetch Codes List...");
    const fetchRes = await axios.get(`${BASE_URL}/qr/codes`, {
      params: { productId: "PRD-MOCK-101", limit: 5 }
    });
    console.log(`Status: ${fetchRes.status}, Pagination:`, fetchRes.data.pagination);
    console.log(`Returned Items count: ${fetchRes.data.items?.length}`);
    console.log("-------------------------------------------\n");

    // 4. Validate Code
    console.log(`4. Testing Code Validation for serial number: ${testCode}...`);
    const valRes = await axios.get(`${BASE_URL}/qr/validate/${testCode}`);
    console.log(`Status: ${valRes.status}, Valid: ${valRes.data.valid}, Status in DB: ${valRes.data.data?.status}`);
    console.log("-------------------------------------------\n");

    // 5. Scan QR Code (Direct scan method)
    console.log(`5. Testing Scan QR Code (Direct) for: ${testCode}...`);
    const scanRes1 = await axios.post(`${BASE_URL}/qr/scan`, 
      {
        qrContent: testCode,
        scanMethod: "QR_SCAN",
      },
      {
        headers: {
          "user-agent": "Antigravity Tester",
          "req-source": "MOBILE",
          "latitude": "12.9716",
          "longitude": "77.5946"
        }
      }
    );
    console.log(`Status: ${scanRes1.status}, Response:`, scanRes1.data);
    console.log("-------------------------------------------\n");

    // 6. Scan QR Code (Manual Entry method)
    console.log(`6. Testing Scan QR Code (Manual Entry) for: ${testCode}...`);
    const scanRes2 = await axios.post(`${BASE_URL}/qr/scan`, 
      {
        qrContent: testCode,
        scanMethod: "MANUAL_ENTRY",
      },
      {
        headers: {
          "user-agent": "Antigravity Tester",
        }
      }
    );
    console.log(`Status: ${scanRes2.status}, Response:`, scanRes2.data);
    console.log("-------------------------------------------\n");

    // 7. Scan QR Code via encoded verification URL
    const mockUrl = `https://verify.relaxwell.com/code/${testCode2}`;
    console.log(`7. Testing Scan QR Code (URL Extract) for: ${mockUrl}...`);
    const scanRes3 = await axios.post(`${BASE_URL}/qr/scan`, 
      {
        qrContent: mockUrl,
        scanMethod: "QR_SCAN",
      },
      {
        headers: {
          "user-agent": "Antigravity Tester",
        }
      }
    );
    console.log(`Status: ${scanRes3.status}, Response:`, scanRes3.data);
    console.log("-------------------------------------------\n");

    // 8. Fetch QR Image PNG binary
    console.log(`8. Testing QR Code PNG rendering for: ${testCode}...`);
    const imgRes = await axios.get(`${BASE_URL}/qr/code/${testCode}`, { responseType: "arraybuffer" });
    console.log(`Status: ${imgRes.status}, Content-Type: ${imgRes.headers["content-type"]}`);
    console.log("-------------------------------------------\n");

    // 9. Asynchronous Enqueue QR Code Generation
    console.log("9. Testing Asynchronous Enqueue QR Code Generation...");
    const mockToken = jwt.sign(
      { userId: "user-123", email: "admin@example.com", mobile: "9876543210", type: "access" },
      process.env.JWT_ACCESS_SECRET || "default_access_secret_123_abc",
      { expiresIn: "1h" }
    );
    const enqueueRes = await axios.post(`${BASE_URL}/qr/qrs`, 
      {
        productId: "PRD-QUEUE-999",
        productName: "Asynchronous Headphones",
        quantity: 5
      },
      {
        headers: {
          Authorization: `Bearer ${mockToken}`
        }
      }
    );
    console.log(`Status: ${enqueueRes.status}, Response:`, enqueueRes.data);
    console.log("-------------------------------------------\n");

    console.log("=== All Tests Completed Successfully ===");
  } catch (error: any) {
    console.error("Test execution failed:", error?.response?.data || error.message);
  }
}

// Run if direct execution
if (require.main === module) {
  runTests();
}
export default runTests;
