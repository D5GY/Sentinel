import { promises as fs, stat as _stat } from 'fs';
import * as nodeUtil from 'util';
import * as path from 'path';
import { Message, User, TextBasedChannelFields, GuildChannel, GuildMember, Guild } from 'discord.js';
import { CommandResponses, SNOWFLAKE_REGEX } from './Constants';
import { Error } from '../structures/SentinelError';
const fileStats = nodeUtil.promisify(_stat);
export default class Util {
	static omitObject<T extends { [key: string]: any }, K extends keyof T>(
		object: T, keys: K[]
	): Omit<T, K> {
		const newObj: { [key: string]: any } = {};
		for (const [key, value] of Object.entries(object)) {
			if (keys.includes(key as K)) continue;
			newObj[key] = value;
		}
		return newObj as { [K in keyof T]: T[K] };
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
		channel: TextBasedChannelFields,
		responseName: T,
		...options: Parameters<(typeof CommandResponses)[T]>
	) {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const response = CommandResponses[responseName as keyof typeof CommandResponses](...options);
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
			? forcedChannel as T : null;
		return msg.guild!.channels.cache.find(
			ch => (!types || types.includes(ch.type)) && (ch.name.toLowerCase() === string)
		) as T | undefined || null;
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
  
	static async extractMentions(string: string | string[], guild: Guild, limit: 1): Promise<SingleMentionData>;
	static async extractMentions(string: string | string[], guild: Guild, limit: number) {
		if (limit === 1) {
			const [mention, ...rest] = typeof string === 'string' ? string.split(' ') : string;
			const obj: SingleMentionData = { content: rest.join(' '), user: null, member: null };
			const userID = mention.match(SNOWFLAKE_REGEX)?.[0];
			console.log(userID);
			if (!userID) return obj;
			try {
				obj.user = await guild.client.users.fetch(userID);
				obj.member = await guild.members.fetch(obj.user);
			} catch { } // eslint-disable-line no-empty
			return obj;
		}
		throw null;
	}

	static isManageableBy(member: GuildMember, by: GuildMember) {
		const { guild } = member;
		if (by.id === guild.ownerID) return true;
		if (member.id === guild.ownerID) return false;
		if (by.roles.highest.rawPosition < member.roles.highest.rawPosition) return false;
		return true;
	}
}

interface SingleMentionData {
  content: string;
  user: User | null;
  member: GuildMember | null;
}