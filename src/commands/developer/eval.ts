import Command, { SendFunction } from '../../util/BaseCommand';
import SentinelClient from '../../client/SentinelClient';
import CommandArguments from '../../util/CommandArguments';
import { Message } from 'discord.js';
import { URLs } from '../../util/Constants';
import * as mysql from 'mysql';
import { SQLValues } from '../../client/database/DatabaseManager';
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unused-vars */

const util: typeof import('util') = require('util');
const djs: typeof import('discord.js') = require('discord.js');
const fetch: typeof import('node-fetch').default = require('node-fetch');
const Util: typeof import('../../util').default = require('../../util').default;

export default class EvalCommand extends Command {
	constructor(client: SentinelClient) {
		super(client, {
			aliases: ['evaluate'],
			dmAllowed: true,
			name: 'eval',
			permissions: (user) => {
				return user.client.config.devs.includes(user.id);
			},
			description: 'Evaluates code.',
			usage: '[code]'
		}, __filename);
	}

	async run(message: Message, args: CommandArguments, send: SendFunction) {
		const _code = args.regular.join(' ');
		const reverse = (string: string) => string.split('').reverse().join('');
		const finish = async (result: unknown) => {
			const inspected = (typeof result === 'string' ? result : util.inspect(result)).replace(
				new RegExp(`${this.client.token}|${reverse(this.client.token!)}`, 'gi'),
				'[TOKEN]'
			);
			if (inspected.length > 1250) {
				const json = await fetch(URLs.HASTEBIN('documents'), {
					body: inspected,
					headers: {
						'Content-Type': 'application/json'
					}, method: 'POST'
				}).then(response => response.json());
				if (!json.key) return send('Output was too long for hastebin');
				const url = URLs.HASTEBIN(json.key);
				return send(`Output was too long, posted to ${url}`);
			}
			return send(inspected, {
				code: 'js'
			});
		};
		const matches = _code.match(/```(?:(?<lang>\S+)\n)?\s?(?<code>[^]+?)\s?```/)?.groups;
		let code = _code;
		if (matches) {
			if (matches.code) code = matches.code;
			if (matches.lang && matches.lang.toLowerCase() === 'sql') {
				try {
					const replaced = code.replace(/{([^}]+)}/gi, (str, match: string) => {
						const props = match.split('.');
						return mysql.escape(Util.getProp({
							client: this.client, message, this: this
						}, props));
					});
					const results = await this.client.database.query<SQLValues>(replaced);
					await finish(results);
				} catch (error) {
					await finish(error.stack || error);
				}
				return;
			}
		}
		try {
			let result = await this._eval(code, message, args);
			if (Array.isArray(result) && result.every(element => typeof element?.then === 'function')) {
				result = await Promise.all(result);
			}
			await finish(result);
		} catch (error) {
			await finish(error.stack || error);
		}
	}

	private _eval(code: string, message: Message, args: CommandArguments): unknown {
		return eval(code);
	}
}