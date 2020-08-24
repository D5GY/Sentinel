import { Message } from 'discord.js';
import Util from '../util';
export default async function messageDelete(
	message: Message
) {
	try {
		if(message.author.bot) return;
		const guildConfig = await message.guild?.fetchConfig();

		if (guildConfig?.logsChannel) {
			await Util.respondWith(guildConfig.logsChannel, 'MESSAGE_DELETE_LOG', message);
		}

	} catch (error) {
		console.error(error);
	}
}