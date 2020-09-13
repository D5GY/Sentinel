import Command, { SendFunction } from '../../util/BaseCommand';
import SentinelClient from '../../client/SentinelClient';
import { Message } from 'discord.js';
import CommandArguments from '../../util/CommandArguments';
import Util from '../../util';

export default class AvatarCommand extends Command {
	constructor(client: SentinelClient) {
		super(client, {
			aliases: ['av'], 
			name: 'avatar',
			dmAllowed: true,
			description: 'Display a user\'s avatar URL.'
		}, __filename);
	}

	async run(message: Message, args: CommandArguments, send: SendFunction) {
		if (!args.regular.length) {
			await send('USER_AVATAR', message.author);
			return;
		}
		const { user } = await Util.extractMentions(args.regular, message.guild!, 1); 
		await send('USER_AVATAR', user ?? message.author);
	}
}