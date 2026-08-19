export declare const TYPERT: {
    package: string;
    face: string;
    schemas: never[];
    invocations: ({
        id: string;
        service: string;
        namespace: string;
        method: string;
        invocation: {
            kind: string;
        };
        parameters: never[];
        result: {
            mode: string;
            typeSymbol: string;
            schema: import("zod").ZodObject<{
                providers: import("zod").ZodArray<import("zod").ZodObject<{
                    id: import("zod").ZodString;
                    name: import("zod").ZodString;
                    models: import("zod").ZodArray<import("zod").ZodObject<{
                        id: import("zod").ZodString;
                        name: import("zod").ZodString;
                        description: import("zod").ZodOptional<import("zod").ZodString>;
                        inputModalities: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodEnum<{
                            text: "text";
                            image: "image";
                        }>>>;
                    }, import("zod/v4/core").$strip>>;
                    modelListError: import("zod").ZodOptional<import("zod").ZodString>;
                }, import("zod/v4/core").$strip>>;
                limits: import("zod").ZodObject<{
                    timeoutMs: import("zod").ZodNumber;
                    maxTokens: import("zod").ZodNumber;
                }, import("zod/v4/core").$strip>;
            }, import("zod/v4/core").$strip>;
        };
        cancellation?: never;
    } | {
        id: string;
        service: string;
        namespace: string;
        method: string;
        invocation: {
            kind: string;
        };
        parameters: {
            name: string;
            wire: string;
            source: string;
            codec: {
                mode: string;
                typeSymbol: string;
                schema: import("zod").ZodObject<{
                    provider: import("zod").ZodString;
                    model: import("zod").ZodString;
                }, import("zod/v4/core").$strip>;
            };
        }[];
        cancellation: {
            parameter: string;
        };
        result: {
            mode: string;
            typeSymbol: string;
            schema: import("zod").ZodDiscriminatedUnion<[import("zod").ZodObject<{
                status: import("zod").ZodLiteral<"success">;
                provider: import("zod").ZodString;
                model: import("zod").ZodString;
                firstTokenMs: import("zod").ZodNullable<import("zod").ZodNumber>;
                totalMs: import("zod").ZodNumber;
                finishReason: import("zod").ZodString;
                usage: import("zod").ZodOptional<import("zod").ZodObject<{
                    inputTokens: import("zod").ZodNumber;
                    outputTokens: import("zod").ZodNumber;
                    cacheReadTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
                    cacheWriteTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
                    reasoningTokens: import("zod").ZodOptional<import("zod").ZodNumber>;
                }, import("zod/v4/core").$strip>>;
            }, import("zod/v4/core").$strip>, import("zod").ZodObject<{
                status: import("zod").ZodLiteral<"failure">;
                provider: import("zod").ZodString;
                model: import("zod").ZodString;
                totalMs: import("zod").ZodNumber;
                failure: import("zod").ZodObject<{
                    code: import("zod").ZodString;
                    message: import("zod").ZodString;
                    status: import("zod").ZodOptional<import("zod").ZodNumber>;
                    requestId: import("zod").ZodOptional<import("zod").ZodString>;
                }, import("zod/v4/core").$strip>;
            }, import("zod/v4/core").$strip>], "status">;
        };
    })[];
    model: {
        services: never[];
        events: never[];
        objects: never[];
    };
};
