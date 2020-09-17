import Command, { SendFunction } from '../../util/BaseCommand';
import SentinelClient from '../../client/SentinelClient';
import { Message } from 'discord.js';
import CommandArguments from '../../util/CommandArguments';
import Util from '../../util';
import CommandError from '../../structures/CommandError';

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
		let user = message.author;
		if (args.regular.length) {
			const { content, users } = await Util.extractMentions(args.regular, {
				client: this.client, guild: message.guild, limit: 1
			});
			if (!users.size) {
				throw new CommandError('UNKNOWN_USER', content, false);
			}
			user = users.first()!;
		}
		await send('USER_AVATAR', user);
	}
}
