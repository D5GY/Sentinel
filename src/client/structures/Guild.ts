import { Structures } from 'discord.js';
import GuildConfig, { RawConfig } from '../../structures/GuildConfig';
import { SQLQueryTypes } from '../../util/Constants';
Structures.extend('Guild', (DJSGuild) =>
	class Message extends DJSGuild {
		public config: GuildConfig | null = null;

		public async fetchConfig(force = false) {
			if (this.config && !force) return this.config;
			const [rawConfig] = await this.client.database.query<RawConfig>(
				'SELECT * FROM guilds WHERE id = :id LIMIT 1', { id: this.id }
			);
			if (!rawConfig) {
				await this.client.database.query(SQLQueryTypes.INSERT, 'guilds', {
					id: this.id
				});
				return this.config = new GuildConfig(this.client, { id: this.id });
			}
			return this.config = new GuildConfig(this.client, rawConfig);
		}
	}
);

declare module 'discord.js' {
	interface Guild {
		config: GuildConfig | null;
		fetchConfig(force?: boolean): Promise<GuildConfig>;
	}
}