const Errors = {
	INVALID_TYPE: (param: string, expected: string) => `Supplied ${param} is not ${expected}`,
	PROPERTY_DOESNT_EXIST: (path: string[], current: string) => `Property ${current} doesn't exist on ${path.join('.')}`
};

const makeError = (Class: typeof Error) => {
	return class SentinelError<T extends keyof typeof Errors> extends Class {
		public code: T;
		public message: string;

		constructor(name: T, ...extras:
			(typeof Errors)[T] extends Function ?
			Parameters<(typeof Errors)[T]> :
			never[]
		) {
			super();
			this.code = name;
			const message = <((...args: (typeof Errors)[T] extends Function
				? Parameters<(typeof Errors)[T]>
				: never[]
			) => string)> Errors[name];
			this.message = message(...extras);
		}

		get name() {
			return `${super.name} [${this.code}]`;
		}
	};
};

const _Error = makeError(Error);
const _RangeError = makeError(RangeError);
const _TypeError = makeError(TypeError);

export {
	_Error as Error,
	_RangeError as RangeError,
	_TypeError as TypeError
};
