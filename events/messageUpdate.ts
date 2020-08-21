import { Message } from 'discord.js';
import messageEvent from './message';

export default function messageUpdate(
	oldMesage: Message,
	newMessage: Message
) {
	// handle embed updates
	if (oldMesage.content === newMessage.content) return;

	messageEvent(newMessage);
}