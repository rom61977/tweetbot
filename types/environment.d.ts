declare global {
	namespace NodeJS {
		interface ProcessEnv {
			NODE_ENV: "development" | "production" | "local";
			[key: string]: string;
		}
	}
}

export {};
