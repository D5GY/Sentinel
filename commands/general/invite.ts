import Command, { SendFunction } from '../../util/BaseCommand';
import SentinelClient from '../../client/SentinelClient';

import { Message } from 'discord.js';
import CommandArguments from '../../util/CommandArguments';

export default class InviteCommand extends Command {
	constructor(client: SentinelClient) {
		super(client, {
			aliases: [],
			name: 'invite',
			dmAllowed: true
		}, __filename);
	}

	async run(message: Message,  args: CommandArguments, send: SendFunction) {    
		await send('CLIENT_INVITE');
	}
}