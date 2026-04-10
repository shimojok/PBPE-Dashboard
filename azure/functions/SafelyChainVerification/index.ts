```typescript
import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { createHash, randomBytes } from "crypto";
import { ConfidentialLedgerClient } from "@azure/arm-confidentialledger";

interface VerificationRequest {
    farmId: string;
    carbonSeq: number;
    yieldData: number;
    qualityScore: number;
    timestamp: string;
    agrixSignature: string;
}

interface VerificationResponse {
    verificationHash: string;
    pbpeCreditIssued: number;
    status: "verified" | "rejected";
    timestamp: string;
    merkleRoot?: string;
}

const CARBON_THRESHOLD = 1000; // 1 tCO₂e minimum
const YIELD_THRESHOLD = 1.35; // 35% increase minimum

const httpTrigger: AzureFunction = async function (
    context: Context,
    req: HttpRequest
): Promise<void> {
    context.log("SafelyChain verification request received");

    try {
        const request = req.body as VerificationRequest;

        // Validate request
        if (!validateRequest(request)) {
            context.res = {
                status: 400,
                body: { error: "Invalid request format" }
            };
            return;
        }

        // Verify AGRIX signature
        if (!verifyAgrixSignature(request)) {
            context.res = {
                status: 401,
                body: { error: "Invalid AGRIX signature" }
            };
            return;
        }

        // Check thresholds
        const meetsThreshold = checkThresholds(request);
        
        // Generate verification hash
        const verificationHash = generateVerificationHash(request);
        
        // Calculate PBPE credit amount
        const pbpeCredit = meetsThreshold ? calculatePBPECredit(request) : 0;

        // Create Merkle root for batch verification
        const merkleRoot = await createMerkleRoot([verificationHash]);

        // Store verification record
        const record = {
            id: verificationHash,
            farmId: request.farmId,
            carbonSeq: request.carbonSeq,
            yieldData: request.yieldData,
            qualityScore: request.qualityScore,
            verificationHash,
            pbpeCreditIssued: pbpeCredit,
            status: meetsThreshold ? "verified" : "rejected",
            timestamp: new Date().toISOString(),
            merkleRoot
        };

        context.bindings.verificationRecord = JSON.stringify(record);

        // Submit to Azure Confidential Ledger
        await submitToConfidentialLedger(record);

        const response: VerificationResponse = {
            verificationHash,
            pbpeCreditIssued: pbpeCredit,
            status: meetsThreshold ? "verified" : "rejected",
            timestamp: record.timestamp,
            merkleRoot
        };

        context.res = {
            status: 200,
            body: response,
            headers: {
                "Content-Type": "application/json"
            }
        };

    } catch (error) {
        context.log.error("Verification error:", error);
        context.res = {
            status: 500,
            body: { error: "Internal server error", details: error.message }
        };
    }
};

function validateRequest(req: VerificationRequest): boolean {
    return !!(
        req.farmId &&
        typeof req.carbonSeq === "number" &&
        req.carbonSeq > 0 &&
        typeof req.yieldData === "number" &&
        req.yieldData > 0 &&
        typeof req.qualityScore === "number" &&
        req.qualityScore >= 0 &&
        req.qualityScore <= 100 &&
        req.timestamp &&
        req.agrixSignature
    );
}

function verifyAgrixSignature(req: VerificationRequest): boolean {
    // In production: Verify cryptographic signature from AGRIX device
    const expectedSignature = createHash("sha256")
        .update(`${req.farmId}:${req.carbonSeq}:${req.yieldData}:${req.qualityScore}:${req.timestamp}`)
        .digest("hex");
    
    return req.agrixSignature === expectedSignature;
}

function checkThresholds(req: VerificationRequest): boolean {
    const carbonThresholdMet = req.carbonSeq >= CARBON_THRESHOLD;
    const yieldThresholdMet = req.yieldData >= YIELD_THRESHOLD;
    const qualityThresholdMet = req.qualityScore >= 80;
    
    return carbonThresholdMet && (yieldThresholdMet || qualityThresholdMet);
}

function generateVerificationHash(req: VerificationRequest): string {
    const data = JSON.stringify({
        farmId: req.farmId,
        carbonSeq: req.carbonSeq,
        yieldData: req.yieldData,
        qualityScore: req.qualityScore,
        timestamp: req.timestamp,
        nonce: randomBytes(16).toString("hex")
    });
    
    return createHash("sha256").update(data).digest("hex");
}

function calculatePBPECredit(req: VerificationRequest): number {
    // PBPE credit calculation formula
    const carbonComponent = req.carbonSeq * 0.8; // 80% of carbon value
    const yieldComponent = (req.yieldData - 1) * 1000 * 0.15; // Yield premium
    const qualityComponent = (req.qualityScore - 80) * 10 * 0.05; // Quality premium
    
    return carbonComponent + yieldComponent + qualityComponent;
}

async function createMerkleRoot(hashes: string[]): Promise<string> {
    // Simple Merkle root calculation
    if (hashes.length === 0) return "";
    if (hashes.length === 1) return hashes[0];
    
    let layer = hashes;
    while (layer.length > 1) {
        const nextLayer: string[] = [];
        for (let i = 0; i < layer.length; i += 2) {
            const left = layer[i];
            const right = i + 1 < layer.length ? layer[i + 1] : left;
            const combined = createHash("sha256")
                .update(left + right)
                .digest("hex");
            nextLayer.push(combined);
        }
        layer = nextLayer;
    }
    return layer[0];
}

async function submitToConfidentialLedger(record: any): Promise<void> {
    // In production: Submit to Azure Confidential Ledger
    context.log("Submitting to Confidential Ledger:", record.id);
}

export default httpTrigger;
```
