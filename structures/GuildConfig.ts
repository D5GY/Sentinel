import { Client, TextChannel, RoleResolvable } from 'discord.js';
import { TypeError } from './SentinelError';
import { SQLValues } from '../client/database/DatabaseManager';


// so i don't have to repeat that long part
const parse = (str: string | null) => str ? JSON.parse(str) : null;

export default class GuildConfig {
	public client!: Client;
	public guildID!: string;
	public prefix!: string | null;
	public modRoleIDs!: string[] | null;
	public adminRoleIDs!: string[] | null;
	public memberJoinsChannelID!: string | null;
	public memberLeavesChannelID!: string | null;
	public logsChannelID!: string | null;
	public autoMod!: boolean;

	private _raw!: RawConfig;
	constructor(client: Client, data: RawConfig | Partial<RawConfig>) {
		Object.defineProperties(this, {
			client: { value: client },
			_raw: { value: data }
		});
		this.patch(data);
	}

	public patch(data: RawConfig | Partial<RawConfig>) {
		if (typeof data.id !== 'undefined') this.guildID = data.id!;
		if (typeof data.prefix !== 'undefined') this.prefix = data.prefix ?? null;
		if (typeof data.mod_roles !== 'undefined') this.modRoleIDs = parse(data.mod_roles ?? null);
		if (typeof data.admin_roles !== 'undefined') this.adminRoleIDs = parse(data.admin_roles ?? null);
		if (typeof data.member_joins_channel !== 'undefined') this.memberJoinsChannelID = data.member_joins_channel ?? null;
		if (typeof data.member_leaves_channel !== 'undefined') this.memberLeavesChannelID = data.member_leaves_channel ?? null;
		if (typeof data.logs_channel !== 'undefined') this.logsChannelID = data.logs_channel;
		if (typeof data.auto_mod !== 'undefined') this.autoMod = data.auto_mod ? Boolean(data.auto_mod) : false;
	}

	public get guild() {
		return this.client.guilds.cache.get(this.guildID) || null;
	}

	public get modRoles() {
		if (!this.guild || !this.modRoleIDs) return null;
		return this.modRoleIDs.map(id => this.guild!.roles.cache.get(id) || null);
	}

	public get adminRoles() {
		if (!this.guild || !this.adminRoleIDs) return null;
		return this.adminRoleIDs.map(id => this.guild!.roles.cache.get(id) || null);
	}

	public get memberJoinsChannel() {
		if (!this.guild || !this.memberJoinsChannelID) return null;
		return (this.guild.channels.cache.get(this.memberJoinsChannelID) || null) as TextChannel | null;
	}

	public get memberLeavesChannel() {
		if (!this.guild || !this.memberLeavesChannelID) return null;
		return (this.guild.channels.cache.get(this.memberLeavesChannelID) || null) as TextChannel | null;
	}
	
	public get logsChannel() {
		if (!this.guild || !this.logsChannelID) return null;
		return (this.guild.channels.cache.get(this.logsChannelID) || null) as TextChannel | null;
	}
  
	public async edit(data: ConfigEditData, fillNull = false) {
		const _data: Partial<RawConfig> = {};

		if (typeof data.prefix !== 'undefined' || fillNull) {
			_data.prefix = data.prefix === this.client.config.defaultPrefix
				? null : (data.prefix || null);
		}

		if (typeof data.modRoles !== 'undefined' || fillNull) {
			if (!data.modRoles) _data.mod_roles = null;
			else {
				const roles = data.modRoles.map(role => this.guild!.roles.resolve(role));
				if (roles.some(id => id === null)) {
					throw new TypeError('INVALID_TYPE', 'modRoles', 'Array of RoleResolvables');
				}
				_data.mod_roles = JSON.stringify(roles.map(role => role!.id));
			}
		}

		if (typeof data.adminRoles !== 'undefined' || fillNull) {
			if (!data.adminRoles) _data.admin_roles = null;
			else {
				const roles = data.adminRoles.map(role => this.guild!.roles.resolve(role));
				if (roles.some(id => id === null)) {
					throw new TypeError('INVALID_TYPE', 'adminRoles', 'Array of RoleResolvables');
				}
				_data.admin_roles = JSON.stringify(roles.map(role => role!.id));
			}
		}

		if (typeof data.memberJoinsChannel !== 'undefined' || fillNull) {
			if (!data.memberJoinsChannel) _data.member_joins_channel = null;
			else {
				const channel = this.guild!.channels.resolve(data.memberJoinsChannel);
				if (!channel || channel.type !== 'text') {
					throw new TypeError('INVALID_TYPE', 'memberJoinsChannel', 'string or TextChannel');
				}
				_data.member_joins_channel = channel.id;
			}
		}

		if (typeof data.memberLeavesChannel !== 'undefined' || fillNull) {
			if (!data.memberLeavesChannel) _data.member_leaves_channel = null;
			else {
				const channel = this.guild!.channels.resolve(data.memberLeavesChannel);
				if (!channel || channel.type !== 'text') {
					throw new TypeError('INVALID_TYPE', 'memberLeavesChannel', 'string or TextChannel');
				}
				_data.member_leaves_channel = channel.id;
			}
		}

		if (typeof data.logsChannel !== 'undefined' || fillNull) {
			if (!data.logsChannel) _data.logs_channel = null;
			else {
				const channel = this.guild!.channels.resolve(data.logsChannel);
				if (!channel || channel.type !== 'text') {
					throw new TypeError('INVALID_TYPE', 'logsChannel', 'string or TextChannel');
				}
				_data.logs_channel = channel.id;
			}
		}

		if (typeof data.autoMod === 'boolean' || fillNull) {
			_data.auto_mod = Number(data.autoMod ?? 0) as 0 | 1;
		}

		await this.client.database.query('UPDATE guilds SET :data WHERE id = :id', {
			data: _data as SQLValues,
			id: this.guildID
		});
		this.patch(_data);
		return this;
	}
}

export interface RawConfig {
	id: string;
	prefix: string | null;
	mod_roles: string | null; // unparsed json
	admin_roles: string | null; // unparsed json
	member_joins_channel: string | null;
	member_leaves_channel: string | null;
	logs_channel: string | null;
	auto_mod: 0 | 1;
}

export interface ConfigEditData {
  prefix?: string | null;
  modRoles?: RoleResolvable[] | null;
  adminRoles?: RoleResolvable[] | null;
  memberJoinsChannel?: string | TextChannel | null;
	memberLeavesChannel?: string | TextChannel | null;
	logsChannel?: string | TextChannel | null;
  autoMod?: boolean;
}