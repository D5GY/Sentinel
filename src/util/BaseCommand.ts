import { MessageOptions, MessageAdditions, PermissionResolvable, GuildMember, TextChannel, NewsChannel, DMChannel, User, Message, Permissions } from 'discord.js';
import CommandArguments from './CommandArguments';
import { CommandResponses } from './Constants';
import SentinelClient from '../client/SentinelClient';

export default class Command {
	public client!: SentinelClient;
	public path: string;

	public aliases: string[];
	public clientPermissions: Permissions | null;
	public category?: string;
	public name: string;
	public usage: string;
	public dmAllowed: boolean;
	public permissions?: number | DMPermissionsFunction | GuildPermissionsFunction;
	public description: string;

	constructor(client: SentinelClient, data: CommandData, path: string) {
		Object.defineProperty(this, 'client', { value: client });
		this.path = path;
		this.aliases = data.aliases ?? [];
		this.name = data.name;
		this.usage = data.usage ?? '';
		this.description = data.description;
		this.dmAllowed = data.dmAllowed ?? false;
		if (data.permissions) {
			this.permissions = typeof data.permissions === 'function'
				? data.permissions : Permissions.resolve(data.permissions);
		}
		if (data.clientPermissions instanceof Permissions) {
			this.clientPermissions = data.clientPermissions.bitfield === 0 ? null : data.clientPermissions;
		} else {
			const permissions = new Permissions(data.clientPermissions);
			if (!permissions.has(Permissions.FLAGS.SEND_MESSAGES)) permissions.add(Permissions.FLAGS.SEND_MESSAGES);
			this.clientPermissions = permissions;
		}
		if (this.clientPermissions !== null) this.clientPermissions.freeze();
	}

	static hasPermissions(command: Command, message: Message) {
		if (!command.permissions) return true;
		let hasPermission: string | boolean | null = true;
		if (typeof command.permissions === 'function') {
			hasPermission = message.guild
				? (<GuildPermissionsFunction> command.permissions)(message.member!, <TextChannel> message.channel)
				: (<DMPermissionsFunction> command.permissions)(message.author, message.member, message.channel);
		} else if (typeof command.permissions === 'number') {
			hasPermission = message.member!.hasPermission(command.permissions);
		}
		return hasPermission;
	}

	async run(message: Message, args: CommandArguments, send: SendFunction) {
		await send('NO_IMPLEMENTATION', args);
	}
}

export type CommandData = {
	aliases?: string[];
	clientPermissions?: PermissionResolvable;
	name: string;
	usage?: string;
	description: string;
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
			const response = CommandResponses[<keyof typeof CommandResponses> content];
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