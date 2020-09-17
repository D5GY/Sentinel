import { CommandErrors } from '../util/Constants';
import { SendFunction } from '../util/BaseCommand';

export default class CommandError<T extends keyof typeof CommandErrors> {
	public name: T;
	public message: string;
	public dmError: boolean;
	public send?: SendFunction;

	constructor(name: T, ...args: Parameters<(typeof CommandErrors[T])>);
	constructor(name: T, sendFunction: SendFunction, ...args: Parameters<(typeof CommandErrors[T])>);
	constructor(name: T, ...extras:
		[SendFunction, ...Parameters<(typeof CommandErrors)[T]>[]]
		| Parameters<(typeof CommandErrors)[T]>
	) {
		this.name = name;
		const message = CommandErrors[name];
		if (typeof extras[0] === 'function') {
			this.send = extras[0];
			extras.splice(0, 1);
		}
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore;
		this.message = message(...extras);

		this.dmError = false;
	}

	dm() {
		this.dmError = true;
		return this;
	}
}
