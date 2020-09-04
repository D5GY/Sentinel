import { Message, Snowflake } from 'discord.js';

const MENTION_REGEX = /<(@!?|@&|#)([0-9]{17,19})>/g;
const cleanContent = (message: Message) => {
	return message.content.toLowerCase().split(' ').reduce((args, argument) => {
		const matches = [...argument.matchAll(MENTION_REGEX)]
			.map(([, type, id]) => [type, id] as ['@!' | '@&' | '@' | '#', Snowflake]);
		if (matches.length) {
			let newArg = '';
			for (const [type, id] of matches) {
				if ((type === '@!' || type === '@') && message.mentions.users.has(id)) {
					if (type === '@!' && message.mentions.members?.has(id)) {
						const member = message.mentions.members.get(id)!;
						newArg += `@${member.nickname || member.user.username}`;
					} else {
						newArg += `@${message.mentions.users.get(id)!.username}`;
					}
				} else if (type === '@&' && message.mentions.roles.has(id)) {
					newArg += `@${message.mentions.roles.get(id)!.name}`;
				} else if (type === '#' && message.mentions.channels.has(id)) {
					newArg += `#${message.mentions.channels.get(id)!.name}`;
				} else {
					newArg += `<${type}${id}>`;
				}
			}
			args.push(newArg);
		} else args.push(argument);
		return args;
	}, [] as string[]);
};

export default class CommandArguments extends Array<string> {
	public regular: string[];

	private readonly _message!: Message;

	constructor(message: Message, args: string[], regular: string[]);
	constructor(message: Message);
	constructor(message: Message, args?: string[], regular?: string[]) {
		super(...(args ?? cleanContent(message).slice(1)));
		this.regular = regular ?? message.content.split(' ').slice(1);
		Object.defineProperty(this, '_message', { value: message });
	}

	slice(start?: number, end?: number) {
		const args = [...this.values()].slice(start, end);
		const regular = this.regular.slice(start, end);
		return new CommandArguments(this._message, args, regular);
	}
}