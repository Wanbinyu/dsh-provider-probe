import { z } from 'zod';
export declare const TokenUsageSchema: z.ZodObject<{
    inputTokens: z.ZodNumber;
    outputTokens: z.ZodNumber;
    cacheReadTokens: z.ZodOptional<z.ZodNumber>;
    cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
    reasoningTokens: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const ProbeModelSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    inputModalities: z.ZodOptional<z.ZodArray<z.ZodEnum<{
        text: "text";
        image: "image";
    }>>>;
}, z.core.$strip>;
export declare const ProbeProviderSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    models: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        inputModalities: z.ZodOptional<z.ZodArray<z.ZodEnum<{
            text: "text";
            image: "image";
        }>>>;
    }, z.core.$strip>>;
    modelListError: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const ProbeCatalogSchema: z.ZodObject<{
    providers: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        models: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            description: z.ZodOptional<z.ZodString>;
            inputModalities: z.ZodOptional<z.ZodArray<z.ZodEnum<{
                text: "text";
                image: "image";
            }>>>;
        }, z.core.$strip>>;
        modelListError: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    limits: z.ZodObject<{
        timeoutMs: z.ZodNumber;
        maxTokens: z.ZodNumber;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const ProbeRequestSchema: z.ZodObject<{
    provider: z.ZodString;
    model: z.ZodString;
}, z.core.$strip>;
export declare const ProbeFailureCategorySchema: z.ZodEnum<{
    credentials: "credentials";
    permission: "permission";
    model_or_endpoint: "model_or_endpoint";
    rate_limit_or_quota: "rate_limit_or_quota";
    timeout: "timeout";
    network: "network";
    stream_compatibility: "stream_compatibility";
    provider_server: "provider_server";
    invalid_request: "invalid_request";
    cancelled: "cancelled";
    busy: "busy";
    unknown: "unknown";
}>;
export declare const ProbeFailureSchema: z.ZodObject<{
    code: z.ZodString;
    message: z.ZodString;
    category: z.ZodEnum<{
        credentials: "credentials";
        permission: "permission";
        model_or_endpoint: "model_or_endpoint";
        rate_limit_or_quota: "rate_limit_or_quota";
        timeout: "timeout";
        network: "network";
        stream_compatibility: "stream_compatibility";
        provider_server: "provider_server";
        invalid_request: "invalid_request";
        cancelled: "cancelled";
        busy: "busy";
        unknown: "unknown";
    }>;
    status: z.ZodOptional<z.ZodNumber>;
    requestId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const ProbeResultSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    status: z.ZodLiteral<"success">;
    provider: z.ZodString;
    model: z.ZodString;
    firstTokenMs: z.ZodNullable<z.ZodNumber>;
    totalMs: z.ZodNumber;
    finishReason: z.ZodString;
    usage: z.ZodOptional<z.ZodObject<{
        inputTokens: z.ZodNumber;
        outputTokens: z.ZodNumber;
        cacheReadTokens: z.ZodOptional<z.ZodNumber>;
        cacheWriteTokens: z.ZodOptional<z.ZodNumber>;
        reasoningTokens: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
}, z.core.$strip>, z.ZodObject<{
    status: z.ZodLiteral<"failure">;
    provider: z.ZodString;
    model: z.ZodString;
    totalMs: z.ZodNumber;
    failure: z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        category: z.ZodEnum<{
            credentials: "credentials";
            permission: "permission";
            model_or_endpoint: "model_or_endpoint";
            rate_limit_or_quota: "rate_limit_or_quota";
            timeout: "timeout";
            network: "network";
            stream_compatibility: "stream_compatibility";
            provider_server: "provider_server";
            invalid_request: "invalid_request";
            cancelled: "cancelled";
            busy: "busy";
            unknown: "unknown";
        }>;
        status: z.ZodOptional<z.ZodNumber>;
        requestId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>], "status">;
