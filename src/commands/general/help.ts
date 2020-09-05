import Command, { SendFunction } from '../../util/BaseCommand';
import SentinelClient from '../../client/SentinelClient';
import { Message } from 'discord.js';
import CommandArguments from '../../util/CommandArguments';

export default class HelpCommand extends Command {
	constructor(client: SentinelClient) {
		super(client, {
			aliases: ['halp'],
			name: 'help',
			dmAllowed: true,
			description: 'List all the Sentinel commands.'
		}, __filename);
	}

	async run(message: Message, args: CommandArguments, send: SendFunction) {
		const pages = this.paginateCommands(message);
		if (pages.length === 1) {
			await send('HELP_PAGE', pages[0]);
			return;
		}
		// it will not be more than 1 at the moment
	}

	public paginateCommands(
		message: Message,
		format = (command: Command) =>
			`${message.guild?.config?.prefix || message.client.config.defaultPrefix}${command.name} ${command.usage ? `${command.usage} ` : ''}- ${command.description}`
	) {
		const pages: string[][] = [[]];
		const sorted = this.sortCommands();
		for (const commands of sorted.values()) {
			for (const command of commands) {
				const hasPermissions = Command.hasPermissions(command, message);
				if (hasPermissions !== true) continue;
				if (pages[pages.length - 1].length === 6) {
					pages.push([]);
				}
				pages[pages.length - 1].push(format(command));
			}
		}
		return pages;
	}

	public sortCommands() {
		const categories = new Map<string, Command[]>();
		for (const command of this.client.commands.values()) {
			const category = categories.get(command.category ?? 'general');
			if (category) {
				category.push(command);
				continue;
			}
			categories.set(command.category ?? 'general', [command]);
		}
		return categories;
	}
}