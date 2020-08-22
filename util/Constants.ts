import GuildConfig from '../structures/GuildConfig';
import { MessageEmbed, GuildMember } from 'discord.js';
import * as moment from 'moment';


export const DEFAULT_TIME_FORMAT = 'DD/MM/YYYY :: HH:mm:ss';
export const SQL_SEARCH_REGEX = /:(\w+)/g;

export enum SQLQueryTypes {
	INSERT = 'INSERT',
	SELECT = 'SELECT',
	UPDATE = 'UPDATE',
	DELETE = 'DELETE'
}

export const CommandResponses = {
	NO_IMPLEMENTATION: (args: string[]) => [
		'This command has no implementation method, args:',
		args.map(arg => `\`${arg}\``).join(', ')
	],
	HELLO_WORLD: () => 'Hello world!',
	ADDED_CONFIG: () => 'Setup the configuration for your server!',
	VIEW_CONFIG: (config: GuildConfig) => {
		const { guild, client } = config;
		return new MessageEmbed()
			.setAuthor(`${guild!.name} Config`, guild!.iconURL({ dynamic: true }) ?? undefined)
			.setDescription([
				`Prefix: ${config.prefix ?? `Default Prefix (${client.config.defaultPrefix})`}`,
				`Auto Mod enabled?: ${config.autoMod ? 'Yes' : 'No'}`,
				`Admin Roles: ${config.adminRoleIDs ? config.adminRoles!.join(', ') : 'None set'}`,
				`Moderator Roles: ${config.modRoleIDs ? config.modRoles!.join(', ') : 'None set'}`,
				`Join Messages: ${config.memberJoinsChannelID
					? config.memberJoinsChannel ?? 'Channel Deleted'
					:	'Disabled'
				}`,
				`Leave Messages: ${config.memberLeavesChannelID
					? config.memberLeavesChannel ?? 'Channel Deleted'
					:	'Disabled'
				}`,
				`Logs Channel: ${config.logsChannelID
					? config.logsChannel ?? 'Channel Deleted'
					:	'Disabled'
				}`
			]);
	},
	MEMBER_JOINED: (member: GuildMember) => {
		const { guild, user } = member;
		return new MessageEmbed()
			.setAuthor(guild.name, guild.iconURL({ dynamic: true }) ?? undefined)
			.setColor(0x00ff00)
			.setDescription('New Member Joined')
			.setFooter('Sentinel')
			.setThumbnail(user.displayAvatarURL({ dynamic: true }))
			.setTimestamp()
			.addFields({ 
				name: 'User / ID',
				value: `${user.tag} / ${user.id}`
			},
			{
				name: 'Account Created At',
				value: moment.utc(user.createdAt).format(DEFAULT_TIME_FORMAT) 
			},
			{
				name: 'New Member Count',
				value: guild.memberCount
			});
	},
	MEMBER_LEFT: (member: GuildMember) => {
		const { guild, user } = member;
		return new MessageEmbed()
			.setAuthor(guild.name, guild.iconURL({ dynamic: true }) ?? undefined)
			.setColor(0xff0000)
			.setDescription('Member Left')
			.setFooter('Sentinel')
			.setThumbnail(user.displayAvatarURL({ dynamic: true }))
			.setTimestamp()
			.addFields({ 
				name: 'User / ID',
				value: `${user.tag} / ${user.id}`
			}, {
				name: 'Account Created At',
				value: moment.utc(user.createdAt).format(DEFAULT_TIME_FORMAT) 
			}, {
				name: 'Originally Joined At',
				value: moment.utc(member.joinedAt).format(DEFAULT_TIME_FORMAT)
			}, {
				name: 'New Member Count',
				value: guild.memberCount
			});
	}
};

export const CommandErrors = {
	NO_PERMISSION: (message?: string) => message ?? 'You don\'t have permissions to use this command!',
	SAY_NO_ARGS: () => 'Please provide something to say!',
	INVALID_MODE: (modes: string[], provided?: string) => `${
		provided
			? `Mode \`${provided}\` is not a valid mode for this command`
			: 'Please provide a mode for this command'
	}, try one of ${modes.map(mode => `\`${mode}\``).join(', ')}.`
};

export const URLs = {
	HASTEBIN: (endpointOrID: string) => `https://paste.nomsy.net${endpointOrID ? `/${endpointOrID}` : ''}`
};