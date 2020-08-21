import Command, { SendFunction } from '../util/BaseCommand';
import SentinelClient from '../client/SentinelClient';
import CommandArguments from '../util/CommandArguments';
import { Message } from 'discord.js';
import CommandError from '../structures/CommandError';

export default class SayCommand extends Command {
	constructor(client: SentinelClient) {
		super(client, {
			aliases: ['repeat'],
			dmAllowed: true,
			name: 'say'
		}, __dirname);
	}

	async run(message: Message, args: CommandArguments, send: SendFunction) {
		if (!args.length) throw new CommandError('SAY_NO_ARGS');
		await send({
			content: args.regular.join(' ')
		});
	}
}