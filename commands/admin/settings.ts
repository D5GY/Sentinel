import Command, { SendFunction } from '../../util/BaseCommand';
import SentinelClient from '../../client/SentinelClient';
import CommandArguments from '../../util/CommandArguments';
import { Message, TextChannel, MessageMentions } from 'discord.js';
import { ConfigEditData } from '../../structures/GuildConfig';
import Util from '../../util';

export enum SettingModes {
	SETUP = 'setup',
	VIEW = 'view'
}

type SetupItem = {
	description: string;
	key: keyof ConfigEditData;
	name: string;
	optional?: boolean;
	type: 'boolean' | 'role' | [
		('string' | 'roles'), number
	] | [
		'channel', ...(keyof typeof ChannelType)[]
	]
}

const SETUP_ITEMS: SetupItem[] = [{
	description: 'The prefix for the bot.',
	key: 'prefix',
	name: 'Prefix',
	optional: true,
	type: ['string', 4]
}, {
	description: 'The moderator roles for this server.',
	key: 'modRoles',
	name: 'Moderator Roles',
	optional: true,
	type: ['roles', -1]
}, {
	description: 'The admin roles for this server.',
	key: 'adminRoles',
	name: 'Admin Roles',
	optional: true,
	type: ['roles', -1]
}, {
	description: 'The channel where new member messages are sent.',
	key: 'memberJoinsChannel',
	name: 'Join Messages Channel',
	optional: true,
	type: ['channel', 'text']
}, {
	description: 'The channel where member leave messages are sent.',
	key: 'memberLeavesChannel',
	name: 'Leave Messages Channel',
	optional: true,
	type: ['channel', 'text']
}, {
	description: 'The channel where logs are sent.',
	key: 'logsChannel',
	name: 'Logs Channel',
	optional: true,
	type: ['channel', 'text']
}, {
	description: 'Auto Moderation (Currently Not Available)',
	key: 'autoMod',
	name: 'Auto Moderation',
	type: 'boolean'
}];

export default class SettingsCommand extends Command {
	constructor(client: SentinelClient) {
		super(client, {
			aliases: [],
			name: 'settings',
			dmAllowed: false,
			permissions: (member) => {
				if (member.hasPermission(8)) return true;
				const { guild: { config } } = member;
				if (!config) return null;
				if (config.adminRoleIDs?.some(id => member.roles.cache.has(id))) return true;
				return 'You need to be a Server Admin to use this command!';
			}
		}, __filename);
	}

	async run(message: Message, args: CommandArguments, send: SendFunction) {
		if (!args[0] || args[0] === SettingModes.VIEW) {
			// force-fetch the config to be certian its updated
			await send('VIEW_CONFIG', await message.guild!.fetchConfig(true));
			return;
		}
		if (args[0] === SettingModes.SETUP) {
			await this.setup(message, send);
			return;
		}
	}

	async setup(message: Message, send: SendFunction) {
		const values: ConfigEditData = {};

		const messages = [];

		for (let i = 0; i < SETUP_ITEMS.length; i++) {
			const data = SETUP_ITEMS[i];
			let type;
			let allowedResponses: string[] | '*' = ['y', 'n'];
			if (data.type === 'boolean') type = 'y/n';
			else {
				allowedResponses = '*';
				if (data.type === 'role') type = 'a role (name/mention/id)';
				else if (data.type[0] === 'roles') {
					type = `${
						(typeof data.type[1] === 'number' && data.type[1] !== -1)
							? data.type[1] : 'multiple'
					} roles (name/mention/id) seperated by a comma`;
				} else if (data.type[0] === 'string') {
					type = `a string of characters${
						data.type[1] !== -1 ? `, max length ${data.type[1]}` : ''}`;
				} else if (data.type[0] === 'channel') {
					const types = data.type.slice(1);
					type = `a channel (name/mention/id) with the type ${
						types.length === 1 ? types[0] : `${types.slice(0, -1).join(', ')}, or ${types[types.length]}`
					}`;
				}
			}
			const str = [];
			if (data.type === 'boolean') str.push(`Would you like ${data.name} enabled? (${type})`);
			else str.push(`What would you like the ${data.name} to be? (${type})`);
			str.push(data.description);
			if (data.optional) {
				if (data.key === 'prefix') str.push('Type `n` if you don\'t want a custom prefix');
				else str.push('Type `n` if you do not want to set this up.');
			}

			const question = await message.channel.send(str);

			const response = await Util.awaitResponse(
				message.channel,
				message.author,
				{ allowedResponses }
			);
			if (!response) {
				await (message.channel as TextChannel).bulkDelete(messages);
				return message.channel.send(
					'3 Minute response timeout, cancelling command'
				);
			}
			messages.push(question.id, response.id);

			if (data.optional && response.content.toLowerCase() === 'n') continue;

			const tryAgain = async (resp: string | string[]) => {
				const errorMessage = await message.channel.send(resp);
				messages.push(errorMessage.id);
				i--;
			};

			// just so TS is happy, and Array.isArray isn't being called alot
			const _isArray = Array.isArray(data.type);
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const isArray = (i: any): i is any[] => _isArray;
			if (isArray(data.type) && data.type[0] === 'string') {
				const maxLength = data.type[1] === -1 ? null : data.type[1];
				const { content } = response;
				if (maxLength !== null && content.length > maxLength) {
					await tryAgain('That string is too long, please try again.');
					continue;
				}
				(values[data.key] as unknown) = content;
			} else if (data.type === 'boolean') {
				(values[data.key] as unknown) = response.content === 'y';
			} else if (data.type === 'role' || (isArray(data.type) && data.type[0] === 'roles')) {
				if (data.type === 'role') {
					const role = Util.resolveRole(response);
					if (!role) {
						await tryAgain('That is not a valid role, please try again');
						continue;
					}
					(values[data.key] as unknown) = role.id;
				} else {
					const _roles = response.content.split(/ *, */g);
					const roles = _roles.map(idOrName => {
						const [id] = idOrName.match(MessageMentions.ROLES_PATTERN) || [];
						return Util.resolveRole(response, id || idOrName.toLowerCase());
					});
					if (roles.some(role => role === null)) {
						await tryAgain('1 or more of those roles aren\'t valid, please try again.');
						continue;
					}
					const maxLength = data.type[1];
					if (maxLength !== -1 && roles.length > maxLength) {
						await tryAgain(`You can provide a maximum of ${maxLength} roles.`);
						continue;
					}
					(values[data.key] as unknown) = roles;
				}
			} else if (isArray(data.type) && data.type[0] === 'channel') {
				const channel = Util.resolveChannel<TextChannel>(response, {
					types: data.type.slice(1) as (keyof typeof ChannelType)[]
				});
				if (!channel) {
					await tryAgain('That is not a valid channel, please try again');
					continue;
				}
				(values[data.key] as unknown) = channel.id;
			}
		}

		await message.guild!.config!.edit(values, true);

		if (messages.length > 100) {
			while (messages.length > 100) {
				const msgs = messages.splice(0, 100);
				await (message.channel as TextChannel).bulkDelete(msgs);
			}
		} else await (message.channel as TextChannel).bulkDelete(messages);
		return send('ADDED_CONFIG');
	}
}