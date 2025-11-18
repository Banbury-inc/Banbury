import { AsyncLocalStorage } from "async_hooks";

type ServerContext = Record<string, any>;

export const serverContext = new AsyncLocalStorage<ServerContext>();

export function runWithServerContext<T>(context: ServerContext, fn: () => Promise<T> | T): Promise<T> | T {
	return serverContext.run(context, fn);
}

export function getServerContextValue<T = any>(key: string): T | undefined {
	const store = serverContext.getStore();
	return (store ? (store[key] as T) : undefined);
}


