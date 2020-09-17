import { promises as fs, stat as _stat } from 'fs';
import * as nodeUtil from 'util';
import * as path from 'path';
import {
	Collection, DiscordAPIError, Constants as DJSConstants,
	Client, Message, User, TextBasedChannelFields,
	GuildChannel,GuildMember, Guild,
	PartialTextBasedChannelFields, DMChannel
} from 'discord.js';
import { CommandResponses, SNOWFLAKE_REGEX } from './Constants';
import { Error } from '../structures/SentinelError';
import CommandError from '../structures/CommandError';
const fileStats = nodeUtil.promisify(_stat);
export default class Util {
	static omitObject<T extends { [key: string]: any }, K extends keyof T>(
		object: T, keys: K[]
	): Omit<T, K> {
		const newObj: { [key: string]: any } = {};
		for (const [key, value] of Object.entries(object)) {
			if (keys.includes(<K> key)) continue;
			newObj[key] = value;
		}
		return <{ [K in keyof T]: T[K] }> newObj;
	}

	static async readdirRecursive(directory: string | string[], filter = (filePath: string) => filePath.includes('.js')) {
		if (Array.isArray(directory)) directory = path.join(...directory);
		const fileNames = [];
		const files = await fs.readdir(directory);
		for (let file of files) {
			file = path.join(directory, file);
			const stats = await fileStats(file);
			if (stats.isDirectory()) {
				const subFiles = await fs.readdir(file);
				for (let subFile of subFiles) {
					subFile = path.join(file, subFile);
					if (filter(subFile)) {
						fileNames.push(subFile);
					}
				}
			} else if (filter(file)) {
				fileNames.push(file);
			}
		}
		return fileNames;
	}

	static respondWith<T extends keyof typeof CommandResponses>(
		channel: PartialTextBasedChannelFields,
		responseName: T,
		...options: Parameters<(typeof CommandResponses)[T]>
	) {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const response = CommandResponses[<keyof typeof CommandResponses> responseName](...options);
		return channel.send(response);
	}

	static async awaitResponse(
		channel: Omit<TextBasedChannelFields, 'bulkDelete'>,
		user: User,
		options: { allowedResponses?: string[] | '*' | (
			(message: Message) => boolean
		), time?: number }
	) {
		if (!options.allowedResponses) options.allowedResponses = '*';
		const response = (await channel.awaitMessages(message => {
			if (message.author.id !== user.id) return false;
			if (options.allowedResponses === '*') return true;
			else if (Array.isArray(options.allowedResponses)) return options.allowedResponses.includes(message.content.toLowerCase());
			else if (typeof options.allowedResponses === 'function') return options.allowedResponses(message);
			return false;
		}, {
			max: 1,
			time: options.time ?? 18e4
		})).first();
		return response ? response : null;
	}

	static resolveRole(msg: Message, string?: string) {
		if (typeof string !== 'string') string = msg.content.toLowerCase();
		return msg.mentions.roles.first()
			|| msg.guild!.roles.cache.get(string)
			|| msg.guild!.roles.cache.find(role => role.name.toLowerCase() === string) || null;
	}

	static resolveChannel<T extends GuildChannel>(msg: Message, { string, types }: {
		string?: string;
		types?: (keyof typeof ChannelType)[];
	} = {}) {
		if (typeof string !== 'string') string = msg.content.toLowerCase();
		const forcedChannel = msg.mentions.channels.first()
			|| msg.guild!.channels.cache.get(string);
		if (forcedChannel) return (!types || types.includes(forcedChannel.type))
			? <T> forcedChannel : null;
		return <T | undefined> msg.guild!.channels.cache.find(
			ch => (!types || types.includes(ch.type)) && (ch.name.toLowerCase() === string)
		) || null;
	}

	static getProp(
		object: any, path: string[], omit = ['token']
	) {
		if (typeof object[path[0]] !== 'object' && path.length > 1) {
			throw new Error('PROPERTY_DOESNT_EXIST', ['Given Object'], path[0]);
		}
		let current: any = object[path[0]];
		for (let i = 1;i < path.length;i++) {
			const prop = path[i];
			if (omit.includes(prop)) break;
			const isLast = i === (path.length-1);
			const type = typeof current[prop];
			if (
				(type !== 'object' && !isLast) || (type === 'undefined' && isLast)
			) {
				throw new Error(
					'PROPERTY_DOESNT_EXIST',
					path.slice(0, i), prop
				);
			}
			current = current[prop];
		}
		return current;
	}

	static async extractMentions(string: string | string[], options: DMMentionExtractOptions): Promise<DMMentionData>;
	static async extractMentions(string: string | string[], options: GuildMentionExtractOptions): Promise<GuildMentionData>;
	static async extractMentions(string: string | string[], options: MentionExtractOptions): Promise<MentionData>;
	static async extractMentions(string: string | string[], options: MentionExtractOptions) {
		const content = typeof string === 'string' ? string.split(' ') : string;
		const users = new Collection<string, User>();
		const members = new Collection<string, GuildMember>();
		const isDM = !options.guild;
		for (let limit = options.limit ?? Infinity;limit > 0;limit--) {
			const mention = content.shift();
			if (!mention) break;
			const userID = mention.match(SNOWFLAKE_REGEX)?.[0];
			if (!userID) {
				content.unshift(mention);
				break;
			}
			try {
				const user = await options.client.users.fetch(userID);
				users.set(user.id, user);
				if (!isDM) {
					const member = await options.guild!.members.fetch(user);
					members.set(user.id, member);
				}
			} catch (error) {
				if (error instanceof DiscordAPIError) {
					if (error.code === DJSConstants.APIErrors.UNKNOWN_USER) {
						throw new CommandError('UNKNOWN_USER', userID);
					}
					if (error.code === DJSConstants.APIErrors.UNKNOWN_MEMBER) {
						continue;
					}
				}
				throw error;
			}
		}
		if (isDM) {
			return { content: content.join(' '), users };
		}
		return { content: content.join(' '), users, members };
	}

	static isManageableBy(member: GuildMember, by: GuildMember) {
		const { guild } = member;
		if (by.id === guild.ownerID) return true;
		if (member.id === guild.ownerID) return false;
		if (by.roles.highest.rawPosition < member.roles.highest.rawPosition) return false;
		return true;
	}

	static isGuildMessage(message: Message): message is GuildMessage {
		return Boolean(message.guild);
	}
}

interface GuildMessage extends Message {
	channel: Exclude<Message['channel'], DMChannel>;
	guild: Guild;
}

interface GuildMentionData {
	content: string;
	users: Collection<string, User>;
	members: Collection<string, GuildMember>;
}

interface DMMentionData {
	content: string;
	users: Collection<string, User>;
}

type MentionData = GuildMentionData | DMMentionData;

interface GuildMentionExtractOptions {
	client: Client;
	guild: Guild;
	limit?: number;
}

interface DMMentionExtractOptions extends Omit<GuildMentionExtractOptions, 'guild'> {
	guild?: null
}

type MentionExtractOptions = GuildMentionExtractOptions | DMMentionExtractOptions;
