import { Client } from 'discord.js';


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
		if (typeof data.auto_mod !== 'undefined') this.autoMod = data.auto_mod ? Boolean(data.auto_mod) : false;
	}

	public get guild() {
		return this.client.guilds.cache.get(this.guildID);
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
		return this.guild.channels.cache.get(this.memberJoinsChannelID) || null;
	}

	public get memberLeavesChannel() {
		if (!this.guild || !this.memberLeavesChannelID) return null;
		return this.guild.channels.cache.get(this.memberLeavesChannelID);
	}
}

export interface RawConfig {
	id: string;
	prefix: string | null;
	mod_roles: string | null; // unparsed json
	admin_roles: string | null; // unparsed json
	member_joins_channel: string | null;
	logs_channel: string | null;
	member_leaves_channel: string | null;
	auto_mod: 0 | 1;
}