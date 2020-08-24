import { Message } from 'discord.js';
import messageEvent from './message';
import Util from '../util';

export default async function messageUpdate(
	oldMessage: Message,
	newMessage: Message
) {
	// handle embed updates
	if (oldMessage.content === newMessage.content) return;

	messageEvent(newMessage);

	try {
		if(oldMessage.author.bot) return;
		const guildConfig = await newMessage.guild!.fetchConfig();

		if(guildConfig?.logsChannel){
			await Util.respondWith(guildConfig.logsChannel, 'MESSAGE_UPDATE_LOG', oldMessage, newMessage);
		}
	} catch (error) {
		console.log(error);
	}
}