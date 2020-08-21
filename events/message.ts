import { Message, GuildChannel } from 'discord.js';
import CommandArguments from '../util/CommandArguments';
import { getSend, DMPermissionsFunction, GuildPermissionsFunction } from '../util/BaseCommand';
import CommandError from '../structures/CommandError';
import { TextChannel } from 'discord.js';

export default async function message(msg: Message) {
	if (msg.author.bot || !msg.content.length) return;

	const { client } = msg;

	try {
		let prefix = client.config.defaultPrefix;
		if (msg.guild) {
			if (
				!(msg.channel as GuildChannel).permissionsFor(client.user!)!.has('SEND_MESSAGES')
			) return;
			const config = await msg.guild.fetchConfig();
			if (config.prefix) prefix = config.prefix;
		}
	
		if (!msg.content.startsWith(prefix)) return;

		const [plainCommand] = msg.content.slice(prefix.length).split(' ');
		const args = new CommandArguments(msg);
	
		const command = client.resolveCommand(plainCommand.toLowerCase());
		if (!command) return;
		const send = getSend(msg, command);
		if (command.permissions) {
			let hasPermission = false;
			if (typeof command.permissions === 'function') {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				hasPermission = msg.guild
					? (command.permissions as GuildPermissionsFunction)(msg.member!, msg.channel as TextChannel)
					: (command.permissions as DMPermissionsFunction)(msg.author, msg.member, msg.channel);
			} else hasPermission = msg.member!.hasPermission(command.permissions);
			if (!hasPermission) throw new CommandError('NO_PERMISSION', send);
		} 
		await command.run(msg, args, send);
	} catch (error) {
		if (error instanceof CommandError) {
			if (error.dmError) {
				return msg.author.send(error.message);
			}
			return error.send
				? error.send(error.message)
				: msg.channel.send(error.message);
		}
		client.emit('error', error);
		msg.channel.send([
			'An unexpected error has occoured',
			`${error.name}: ${error.message}`
		]).catch(error => client.emit('error', error));
	}
}