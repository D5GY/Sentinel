import { MessageOptions, MessageAdditions, PermissionResolvable, GuildMember, TextChannel, NewsChannel, DMChannel, User, Message } from 'discord.js';
import CommandArguments from './CommandArguments';
import { CommandResponses } from './Constants';
import SentinelClient from '../client/SentinelClient';

export default class Command {
	public client!: SentinelClient;
	public path: string;

  public aliases: string[];
  public category?: string;
	public name: string;
	public usage: string;
	public dmAllowed: boolean;
	public permissions?: CommandData['permissions'];

	constructor(client: SentinelClient, data: CommandData, path: string) {
		Object.defineProperty(this, 'client', { value: client });
		this.path = path;
		this.aliases = data.aliases ?? [];
		this.name = data.name;
		this.usage = data.usage ?? '';
		this.dmAllowed = data.dmAllowed ?? false;
		this.permissions = data.permissions;
	}

	async run(message: Message, args: CommandArguments, send: SendFunction) {
		await send('NO_IMPLEMENTATION', args);
	}
}

export type CommandData = {
	aliases?: string[];
	name: string;
	usage?: string;
} & ({
	dmAllowed: false;
	permissions?: PermissionResolvable | GuildPermissionsFunction;
} | {
	dmAllowed: true;
	permissions?: DMPermissionsFunction
});

export type GuildPermissionsFunction = ((member: GuildMember, channel: TextChannel | NewsChannel) => (boolean | string | null))
export type DMPermissionsFunction = (user: User, member: GuildMember | null, channel: DMChannel | TextChannel | NewsChannel) => (boolean | string | null);

export function getSend(message: Message, command: Command) {
	function send(
		content: Exclude<string, keyof typeof CommandResponses> | string[] | MessageOptions | MessageAdditions,
		...options: [MessageOptions | MessageAdditions] | []
	): Promise<Message>
	function send<T extends keyof typeof CommandResponses>(
		responseName: T,
		...options: Parameters<(typeof CommandResponses)[T]>
	): Promise<Message>;
	async function send(
		content: string | string[] | MessageOptions | MessageAdditions,
		...options: any[]
	) {
		if (typeof content === 'string') {
			const response = CommandResponses[content as keyof typeof CommandResponses];
			if (typeof response === 'function') {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				content = response(...options);
				options = [];
			}
		}
		let response = message.lastCommand && message.lastCommand.response;
		response = await (response
			? response.edit(content, ...options)
			: message.channel.send(content, ...options));
		message.setLastCommand(command, response);
		return response;
	}
	return send;
}

export type SendFunction = ReturnType<typeof getSend>;