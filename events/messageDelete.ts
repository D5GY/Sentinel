import { Message, PartialMessage } from 'discord.js';
import Util from '../util';
export default async function messageDelete(
	message: Message | PartialMessage
) {
	try {
		if (message.author?.bot || !message.guild) return;
		const guildConfig = await message.guild.fetchConfig();

		if (guildConfig.logsChannel) {
			await Util.respondWith(guildConfig.logsChannel, 'MESSAGE_DELETE_LOG', message);
		}

	} catch (error) {
		console.error(error);
	}
}