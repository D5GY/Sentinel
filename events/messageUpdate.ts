import { Message, PartialMessage } from 'discord.js';
import messageEvent from './message';
import Util from '../util';

export default async function messageUpdate(
	oldMessage: Message | PartialMessage,
	newMessage: Message | PartialMessage
) {
	try {
		if (newMessage.partial) newMessage = await newMessage.fetch();
		// handle embed updates
		if (oldMessage.content === newMessage.content) return;

		messageEvent(newMessage);

		if(newMessage.author.bot || !newMessage.guild) return;
		const guildConfig = await newMessage.guild!.fetchConfig();

		if(guildConfig.logsChannel){
			await Util.respondWith(guildConfig.logsChannel, 'MESSAGE_UPDATE_LOG', oldMessage, newMessage);
		}
	} catch (error) {
		console.log(error);
	}
}