import { Message, TextChannel, Permissions } from 'discord.js';
import CommandArguments from '../util/CommandArguments';
import Command, { getSend } from '../util/BaseCommand';
import CommandError from '../structures/CommandError';
import Util from '../util';

const GUILD_PERMISSIONS = [
	Permissions.FLAGS.BAN_MEMBERS,
	Permissions.FLAGS.CHANGE_NICKNAME,
	Permissions.FLAGS.KICK_MEMBERS,
	Permissions.FLAGS.MANAGE_CHANNELS,
	Permissions.FLAGS.MANAGE_EMOJIS,
	Permissions.FLAGS.MANAGE_GUILD,
	Permissions.FLAGS.MANAGE_NICKNAMES,
	// Manage Roles can be legitimetly be applied to a channel, so an explicit-in-command check is required
	Permissions.FLAGS.MANAGE_ROLES,
	Permissions.FLAGS.VIEW_AUDIT_LOG,
	Permissions.FLAGS.VIEW_GUILD_INSIGHTS
];

let MENTION_REGEX: RegExp | null = null;

export default async function message(msg: Message) {
	if (msg.author.bot || !msg.content.length) return;

	const { client } = msg;
	const edited = Boolean(msg.editedTimestamp);

	try {
		let prefix = client.config.defaultPrefix;
		if (msg.guild) {
			const config = await msg.guild.fetchConfig();
			if (config.prefix) prefix = config.prefix;
			if (
				config.autoMod && !msg.member!.hasPermission(Permissions.FLAGS.ADMINISTRATOR) && (
					!config.modRoleIDs || !config.modRoleIDs.some(roleID => msg.member!.roles.cache.has(roleID))
				) && (
					!config.adminRoleIDs || !config.adminRoleIDs.some(roleID => msg.member!.roles.cache.has(roleID))
				)
			) {
				const cont = await automod(msg);
				if (!cont) return;
			}
		}

		if (!edited) {
			if (!MENTION_REGEX) MENTION_REGEX = new RegExp(`^<@!?${client.user!.id}>$`);
			if (MENTION_REGEX.test(msg.content)) {
				return msg.channel.send(`My prefix is \`${prefix}\``);
			}
		}

		if (!msg.content.startsWith(prefix)) return;

		const [plainCommand] = msg.content.slice(prefix.length).split(' ');
		const args = new CommandArguments(msg);

		const command = client.resolveCommand(plainCommand.toLowerCase());
		if (!command || (!command.dmAllowed && !msg.guild)) return;
		const send = getSend(msg, command);
		let { clientPermissions } = command;
		if (clientPermissions !== null && msg.guild) {
			let hasPermission = false;
			const guildPermissions = new Permissions(GUILD_PERMISSIONS.filter(perm => clientPermissions!.has(perm)));
			if (guildPermissions.bitfield !== 0) {
				// Command#permissions is frozen, a new object is created
				clientPermissions = clientPermissions.remove(guildPermissions.bitfield);
				hasPermission = msg.guild.me!.hasPermission(guildPermissions.bitfield);
			}
			if (clientPermissions.bitfield !== 0) {
				hasPermission = (<TextChannel> msg.channel).permissionsFor(client.user!)!.has(clientPermissions.bitfield);
			}
			if (!hasPermission) {
				return send('CLIENT_MISSING_PERMISSIONS', clientPermissions, guildPermissions);
			}
		}
		const hasPermissions = Command.hasPermissions(command, msg);
		if (hasPermissions !== true) {
			if (hasPermissions === false) throw new CommandError('NO_PERMISSION', send);
			else if (typeof hasPermissions === 'string') {
				return send({ content: hasPermissions });
			} else if (hasPermissions === null) return;
		}
		await command.run(msg, args, send);
	} catch (error) {
		if (error instanceof CommandError) {
			return error.send
				? error.send(error.message)
				: (error.dmError ? msg.author : msg.channel).send(error.message);
		}
		client.emit('error', error);
		msg.channel.send([
			'An unexpected error has occoured',
			`${error.name}: ${error.message}`
		]).catch(error => client.emit('error', error));
	}
}

async function automod(msg: Message) {
	if (msg.invites) {
		await msg.delete({ timeout: 50 });
		await Util.respondWith(msg.channel, 'INVITES_NOT_ALLOWED', msg.author);
		return false;
	}
	return true;
}
