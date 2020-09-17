import { Guild } from 'discord.js';
import Util from '../util';

export default async function guildDelete(guild: Guild) {
	const { config } = guild.client;
	if (config.guildLogsChannel) {
		await Util.respondWith(config.guildLogsChannel, 'GUILD_REMOVE_LOG', guild);
	}
}
