import { promises as fs, stat as _stat } from 'fs';
import * as nodeUtil from 'util';
import * as path from 'path';
import { MessageOptions, MessageAdditions } from 'discord.js';
import { CommandResponses } from './Constants';
import { Message } from 'discord.js';
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

	static respondTo<T extends keyof typeof CommandResponses>(
		message: Message,
		responseName: T | string | string[] | MessageOptions | MessageAdditions[],
		...options: (typeof CommandResponses)[T] extends (...args: any[]) => any
			? Parameters<(typeof CommandResponses)[T]> : [MessageOptions | MessageAdditions]
	) {
		if (
			typeof responseName !== 'string' ||
			!CommandResponses[responseName as keyof typeof CommandResponses]
		) {
			return message.channel.send(responseName, options[0] as MessageOptions);
		}
		let response: Function | string = CommandResponses[responseName as keyof typeof CommandResponses];
		if (typeof response === 'function') response = response(...options);
		return message.channel.send(response);
	}
}