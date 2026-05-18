export interface FrameworkDetection {
    name: string;
    confidence: "low" | "medium" | "high";
    reason: string;
}
