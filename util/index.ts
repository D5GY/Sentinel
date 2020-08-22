import { promises as fs, stat as _stat } from 'fs';
import * as nodeUtil from 'util';
import * as path from 'path';
import { MessageOptions, MessageAdditions, Message, User, TextBasedChannelFields } from 'discord.js';
import { CommandResponses } from './Constants';
import { GuildChannel } from 'discord.js';
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
		responseName: T | string | string[] | MessageOptions | MessageAdditions[],
		...options: (typeof CommandResponses)[T] extends (...args: any[]) => any
			? Parameters<(typeof CommandResponses)[T]> : [MessageOptions | MessageAdditions]
	) {
		if (
			typeof responseName !== 'string' ||
			!CommandResponses[responseName as keyof typeof CommandResponses]
		) {
			return channel.send(responseName, options[0] as MessageOptions);
		}
		let response: Function | string = CommandResponses[responseName as keyof typeof CommandResponses];
		if (typeof response === 'function') response = response(...options);
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
}