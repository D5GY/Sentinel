import Command, { SendFunction } from '../../util/BaseCommand';
import SentinelClient from '../../client/SentinelClient';
import { Message } from 'discord.js';
import CommandArguments from '../../util/CommandArguments';
import CommandError from '../../structures/CommandError';
import Util from '../../util';

export default class RoleinfoCommand extends Command {
	constructor(client: SentinelClient) {
		super(client, {
			aliases: [],
			name: 'roleinfo',
			dmAllowed: false,
			description: 'Get information about a specific role.'
		}, __filename);
	}

	async run(message: Message, args: CommandArguments, send: SendFunction) {
		const noRole = new CommandError('MENTION_ROLE');
		if (!args[0]) throw noRole;

		const role = Util.resolveRole(message, args[0]);
		if (!role) throw noRole;

		await send('ROLE_INFO', role);
	}
}
