import { Message, PartialMessage, Permissions } from 'discord.js';
import messageEvent from './message';
import Util from '../util';
import { SEND_MESSAGE_PERMISSIONS } from '../util/Constants';

export default async function messageUpdate(
	oldMessage: Message | PartialMessage,
	newMessage: Message | PartialMessage
) {
	try {
		const { client } = newMessage;
		if (newMessage.channel.type === 'dm') return;
		if (newMessage.partial) {
			if (!newMessage.channel.permissionsFor(client.user!)?.has([
				Permissions.FLAGS.READ_MESSAGE_HISTORY, Permissions.FLAGS.VIEW_CHANNEL
			])) return;
			newMessage = await newMessage.fetch();
		}
		// handle embed updates
		if (oldMessage.content === newMessage.content) return;

		messageEvent(newMessage);

		if (newMessage.author.bot) return;
		const guildConfig = await newMessage.guild!.fetchConfig();

		if (guildConfig.logsChannel?.permissionsFor(newMessage.client.user!)?.has(SEND_MESSAGE_PERMISSIONS)) {
			await Util.respondWith(guildConfig.logsChannel, 'MESSAGE_UPDATE_LOG', oldMessage, newMessage);
		}
	} catch (error) {
		console.log(error);
	}
}