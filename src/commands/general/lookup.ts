import Command, { SendFunction } from '../../util/BaseCommand';
import SentinelClient from '../../client/SentinelClient';
import { Message } from 'discord.js';
import CommandArguments from '../../util/CommandArguments';
import CommandError from '../../structures/CommandError';
import { IP_REGEX, URLs } from '../../util/Constants';
import fetch from 'node-fetch';

export default class LookupCommand extends Command {
	constructor(client: SentinelClient) {
		super(client, {
			aliases: ['geo'],
			name: 'lookup',
			dmAllowed: true,
			description: 'Lookup a IP'
		}, __filename);
	}

	async run(message: Message, args: CommandArguments, send: SendFunction) {
		const ip = args[0];
		const valid = IP_REGEX.test(ip);
		if (!ip || !valid) throw new CommandError('PROVIDE_IP');
     
		const response = await fetch(URLs.IP_API(ip));
		if (response.status == 404) throw new CommandError('PROVIDE_IP');
		const data = await response.json();

		await send('LOOKUP', data);
	}
}

export interface data {
  status: 'success' | 'fail';
  query: string;
  isp: string;
  country: string;
  regionName: string;
  city: string;
  timezone: string;
  zip: string;
  lat: number;
  lon: number;
  org: string;
}
