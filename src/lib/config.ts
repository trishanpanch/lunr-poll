export const IS_DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export const isLocalSession = (sessionId: string) => sessionId.startsWith("local_");
