import { Message, Permissions } from 'discord.js';
import Util from '../util';

export default class AutoMod {
	static async inviteCheck(msg: Message) {
		if (
			!msg.guild!.me!.hasPermission(Permissions.FLAGS.MANAGE_MESSAGES) ||
			!msg.invites || !msg.invites.length
		) return false;
		await msg.delete({ timeout: 100 });
		await Util.respondWith(msg.channel, 'INVITES_NOT_ALLOWED', msg.author);
		return true;
	}
}