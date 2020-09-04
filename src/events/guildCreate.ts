import { Guild } from 'discord.js';
import Util from '../util';

export default async function guildCreate(guild: Guild) {
	const { config } = guild.client;
	if (config.guildLogsChannel) {
		await Util.respondWith(config.guildLogsChannel, 'GUILD_CREATE_LOG', guild);
	}
}