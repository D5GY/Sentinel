import Command, { SendFunction } from '../../util/BaseCommand';
import SentinelClient from '../../client/SentinelClient';
import { Message } from 'discord.js';
import CommandArguments from '../../util/CommandArguments';
import CommandError from '../../structures/CommandError';
import { URLs } from '../../util/Constants';
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
		const valid = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip);
		if (!ip || !valid) throw new CommandError('PROVIDE_IP');
     
		const response = await fetch(URLs.IP_API(ip));
		if (response.status == 404) throw new CommandError('PROVIDE_IP');
		const data = await response.json();

		await send('LOOKUP', data);
	}
}

export interface IPData {
  status: 'success' | 'fail';
  query: string | 'Unknown';
  isp: string | 'Unknown';
  country: string | 'Unknown';
  regionName: string | 'Unknown';
  city: string | 'Unknown';
  timezone: string | 'Unknown';
  zip: string | 'Unknown';
  lat: number | 'Unknown';
  lon: number | 'Unknown';
  org: string | 'Unknown';
}
