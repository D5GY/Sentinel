import Command, { SendFunction } from '../../util/BaseCommand';
import SentinelClient from '../../client/SentinelClient';
import CommandArguments from '../../util/CommandArguments';
import { Message, TextChannel, MessageMentions, Role, Permissions, GuildChannel, DMChannel } from 'discord.js';
import { ConfigEditData } from '../../structures/GuildConfig';
import Util from '../../util';
import CommandError from '../../structures/CommandError';
import { cleanPermissions, SEND_MESSAGE_PERMISSIONS } from '../../util/Constants';

export enum SettingModes {
	SETUP = 'setup',
	VIEW = 'view',
	EDIT = 'edit'
}

export type SetupItem = {
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

export const SETUP_ITEMS: SetupItem[] = [{
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
				if (member.hasPermission(Permissions.FLAGS.ADMINISTRATOR)) return true;
				const { guild: { config } } = member;
				if (!config) return null;
				if (
					member.client.config.devs.includes(member.id) ||
					config.adminRoleIDs?.some(id => member.roles.cache.has(id))
				) return true;
				return 'You need to be a Server Admin to use this command!';
			},
			description: 'Views, changes, or setups the config.',
			usage: '<\'setup\' | \'edit\' [setting] [new value]>'
		}, __filename);
	}

	async run(message: Message, args: CommandArguments, send: SendFunction) {
		if (!args[0] || args[0] === SettingModes.VIEW) {
			// force-fetch the config to be certian its updated
			await send('VIEW_CONFIG',
				await message.guild!.fetchConfig(true),
        (<TextChannel> message.channel).permissionsFor(this.client.user!)!.has(Permissions.FLAGS.EMBED_LINKS)
			);
			return;
		} else if (args[0] === SettingModes.SETUP) {
			await this.setup(message, send);
			return;
		} else if (args[0] === SettingModes.EDIT) {
			await this.edit(message, args.slice(1), send);
			return;
		}
		throw new CommandError('INVALID_MODE', Object.values(SettingModes));
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
				await (<TextChannel> message.channel).bulkDelete(messages);
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

			const value = this.resolveValue(data, response, response.content);
			const result = this.validateValue(value, data, 'please try again');
			if (typeof result === 'string') {
				await tryAgain(result);
				continue;
			}
			(<unknown> values[data.key]) = value;
		}

		await message.guild!.config!.edit(values, true);

		if (messages.length > 100) {
			while (messages.length > 100) {
				const msgs = messages.splice(0, 100);
				await (<TextChannel> message.channel).bulkDelete(msgs);
			}
		} else await (<TextChannel> message.channel).bulkDelete(messages);
		return send('ADDED_CONFIG');
	}

	async edit(message: Message, args: CommandArguments, send: SendFunction) {
		const item = SETUP_ITEMS.find(item => item.key.toLowerCase() === args[0]);
		if (!item) {
			throw new CommandError('INVALID_SETTING', send, SETUP_ITEMS.map(item => item.key));
		}
		const newValue = this.resolveValue(
			item, message, args.regular.slice(1).join(' ')
		);
		const result = this.validateValue(newValue, item);
		if (typeof result === 'string') {
			throw new CommandError('CUSTOM_MESSAGE', result);
		}
		await message.guild!.config!.edit({
			[item.key]: newValue
		});
		await send('UPDATED_CONFIG', item.name);
	}

	public resolveValue(item: SetupItem, message: Message, string?: string) {
		if (!string) string = message.content;
		// just so TS is happy, and Array.isArray isn't being called alot
		const _isArray = Array.isArray(item.type);
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const isArray = (i: any): i is any[] => _isArray;
		if (isArray(item.type) && item.type[0] === 'string') {
			const maxLength = item.type[1] === -1 ? null : item.type[1];
			if (maxLength !== null && string.length > maxLength) {
				return null;
			}
			return string;
		} else if (item.type === 'boolean') {
			return ['y', 'yes', 'enable', 'enabled'].includes(string);
		} else if (item.type === 'role' || (isArray(item.type) && item.type[0] === 'roles')) {
			if (item.type === 'role') {
				const role = Util.resolveRole(message, string);
				if (!role) {
					return null;
				}
				return role.id;
			} else {
				const _roles = string.split(/ *, */g);
				const roles = _roles.map(idOrName => {
					const [id] = idOrName.match(MessageMentions.ROLES_PATTERN) || [];
					return Util.resolveRole(message, id || idOrName.toLowerCase());
				});
				if (roles.some(role => role === null)) {
					return null;
				}
				const maxLength = item.type[1];
				if (maxLength !== -1 && roles.length > maxLength) {
					return null;
				}
				return <Role[]> roles;
			}
		} else if (isArray(item.type) && item.type[0] === 'channel') {
			const channel = Util.resolveChannel<TextChannel>(message, {
				types: <(keyof typeof ChannelType)[]> item.type.slice(1),
				string: string.toLowerCase()
			});
			if (!channel) {
				return null;
			}
			return channel.id;
		}
		throw null;
	}

	public validateValue(value: ConfigValue | null, item: SetupItem, suffix = ''): true | string {
		if (value !== null) {
			if (item.type[0] === 'channel') {
				const ch = <GuildChannel | DMChannel | undefined> this.client.channels.cache.get(<string> value);
				if (ch && ch.type !== 'dm') {
					if (!ch.permissionsFor(this.client.user!)?.has(SEND_MESSAGE_PERMISSIONS)) {
						return `I need the ${cleanPermissions(new Permissions(SEND_MESSAGE_PERMISSIONS))} permissions for that channel`;
					}
				}
			}
			return true;
		}
		if (item.type === 'boolean') {
			throw null;
		} else if (item.type === 'role') {
			return `That is not a valid role${suffix}.`;
		} else if (item.type[0] === 'string') {
			return `That string is too long${suffix}.`;
		} else if (item.type[0] === 'channel') {
			return `That is not a valid channel${suffix}.`;
		} else if (item.type[0] === 'roles') {
			return `You provided an invalid role${
				item.type[1] !== -1 ? `, or too many roles (max: ${item.type[1]})` : ''
			}${suffix}.`;
		}
		throw null;
	}
}

type ConfigValue = Exclude<ReturnType<SettingsCommand['resolveValue']>, null>