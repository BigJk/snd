/**
 * A result type that can be used to return a value or an error.
 * Inspired by go and rust error as a value handling.
 */
export type Result<T> =
	| {
			hasError: false;
			value: T;
	  }
	| {
			hasError: true;
			error: string;
	  };

/**
 * Creates a result with a value.
 * @param value The value.
 */
export function ok<T>(value: T): Result<T> {
	return { hasError: false, value: value };
}

/**
 * Creates a result with an error.
 * @param error The error.
 */
export function err<T>(error: string): Result<T> {
	return { hasError: true, error };
}

/**
 * Safely calls a function and returns a result. If the function throws an error, the error is returned.
 * @param fn The function to call.
 */
export function safeCall<T>(fn: () => T): Result<T> {
	try {
		return ok(fn());
	} catch (e: any) {
		return err(e.message);
	}
}

/**
 * Safely calls a promise and returns a result. If the promise rejects, the error is returned.
 * @param promise The promise to call.
 */
export function safePromise<T>(promise: Promise<T>): Promise<Result<T>> {
	return promise.then(ok).catch((e) => err(e.message));
}
