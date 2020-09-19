import Command, { SendFunction } from '../../util/BaseCommand';
import SentinelClient from '../../client/SentinelClient';
import { Message } from 'discord.js';
import CommandArguments from '../../util/CommandArguments';

export default class guildStatsCommand extends Command {
	constructor(client: SentinelClient) {
		super(client, {
			aliases: ['gs', 'serverinfo', 'guildinfo', 'serverstats'],
			name: 'guildstats',
			dmAllowed: false,
			description: 'Display your guild information.'
		}, __filename);
	}

	async run(message: Message, args: CommandArguments, send: SendFunction) {
		await send('GUILD_STATS', message.guild!);
	}
}
