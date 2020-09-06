import { Message, PartialMessage } from 'discord.js';
import Util from '../util';
import { SEND_MESSAGE_PERMISSIONS } from '../util/Constants';

export default async function messageDelete(
	message: Message | PartialMessage
) {
	try {
		if (message.author?.bot || !message.guild) return;
		const guildConfig = await message.guild.fetchConfig();

		if (guildConfig.logsChannel?.permissionsFor(message.client.user!)?.has(SEND_MESSAGE_PERMISSIONS)) {
			await Util.respondWith(guildConfig.logsChannel, 'MESSAGE_DELETE_LOG', message);
		}

	} catch (error) {
		console.error(error);
	}
}