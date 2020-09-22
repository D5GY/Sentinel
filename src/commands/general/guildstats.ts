import Command, { SendFunction } from '../../util/BaseCommand';
import SentinelClient from '../../client/SentinelClient';
import { Message } from 'discord.js';
import CommandArguments from '../../util/CommandArguments';

export default class GuildStatsCommand extends Command {
	constructor(client: SentinelClient) {
		super(client, {
			aliases: ['gs', 'serverinfo', 'guildinfo', 'serverstats'],
			name: 'guildstats',
			dmAllowed: false,
			description: 'Displays information about the current server.'
		}, __filename);
	}

	async run(message: Message, args: CommandArguments, send: SendFunction) {
		await send('GUILD_STATS', message.guild!);
	}
}
