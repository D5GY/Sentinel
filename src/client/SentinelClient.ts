import { Client, ClientOptions, Collection, Message, TextChannel } from 'discord.js';
import Util from '../util';
import DatabaseManager from './database/DatabaseManager';
import Command from '../util/BaseCommand';
import * as path from 'path';

type CommandConstructable = (new (client: SentinelClient) => Command);

interface SentinelClientEvents {
	commandRan: [Command, Message];
}

export default class SentinelClient extends Client {
	public commands = new Collection<string, Command>();
	public config: {
		defaultPrefix: string;
		devs: string[];
		PRODUCTION: boolean;
		readonly guildLogsChannelID: string;
		readonly guildLogsChannel: TextChannel | null;
		readonly suggestionsChannelID: string;
		readonly suggestionsChannel: TextChannel | null;
	};
	public database: DatabaseManager;
	private __events: { path: string; fn: (...args: any[]) => void }[] = []

	constructor(config: SentinelConfig, options?: ClientOptions) {
		super(options);
		this.token = config.token;
		const _config = Util.omitObject(config, ['database', 'token', 'channels']);
		Object.defineProperties(_config, {
			guildLogsChannelID: { value: config.channels.guildLogs },
			guildLogsChannel: { get: () => this.channels.resolve(this.config.guildLogsChannelID) },
			suggestionsChannelID: { value: config.channels.suggestions },
			suggestionsChannel: { get: () => this.channels.resolve(this.config.suggestionsChannelID) }
		});
		this.config = <SentinelClient['config']> _config;
		this.database = new DatabaseManager(config.database);
	}

	public resolveCommand(input: string, withAlias: true): { alias: string | null, command: Command | null };
	public resolveCommand(input: string, withAlias?: false): Command | null;
	public resolveCommand(input: string, withAlias = false) {
		let foundCommand: Command | null = null;
		let foundAlias: string | null = null;
		if (this.commands.has(input)) foundCommand = this.commands.get(input)!;
		else {
			for (const command of this.commands.array()) {
				const alias = command.aliases.find(a => input === a);
				if (alias) {
					foundCommand = command;
					foundAlias = alias;
					break;
				}
			}
		}
		return withAlias ? { alias: foundAlias, command: foundCommand } : foundCommand;
	}

	public async loadCommands() {
		if (this.commands.size) {
			for (const [key, { path }] of this.commands) {
				delete require.cache[path];
				this.commands.delete(key);
			}
		}
		const commandFiles = await Util.readdirRecursive([__dirname, '..', 'commands']);
		for (const file of commandFiles) {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			let Struct: CommandConstructable | { default: CommandConstructable } = require(file);
			if (typeof Struct !== 'function') Struct = Struct.default;
			const constructed = new Struct(this);
			const dir = file.split(path.sep);
			const folder = dir[dir.length - 2];
			if (folder !== 'commands') {
				constructed.category = folder;
			}
			this.commands.set(constructed.name, constructed);
		}
		return this.commands;
	}

	public async loadEvents() {
		if (this.__events.length) {
			const cloned = this.__events.slice();
			for (let i = 0; i < cloned.length; i++) {
				const { path, fn } = cloned[i];
				this.__events.splice(i, 1);
				this.off(fn.name, fn);
				delete require.cache[path];
			}
		}
		const eventFiles = await Util.readdirRecursive([__dirname, '..', 'events']);
		for (const file of eventFiles) {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			let fn: ((...args: any[]) => void) | { default: (...args: any[]) => void } = require(file);
			if (typeof fn !== 'function') fn = fn.default;
			this.on(fn.name, fn);
			this.__events.push({ path: file, fn });
		}
		return this.__events.reduce<{ [key: string]: ((...args: any[]) => void)[] }>((acc, { fn }) => {
			if (!acc[fn.name]) acc[fn.name] = [fn];
			else acc[fn.name].push(fn);
			return acc;
		}, {});
	}

	public async connect() {
		await this.loadCommands();
		await this.loadEvents();
		await this.database.open();
		await this.login();
	}
}

export interface SentinelConfig {
	token: string;
	defaultPrefix: string;
	devs: string[];
	database: {
		host: string;
		user: string;
		password: string;
		database: string;
	};
	channels: {
		suggestions: string;
		guildLogs: string;
	};
	PRODUCTION: boolean;
}

declare module 'discord.js' {
	interface Client {
		commands: Collection<string, Command>;
		config: SentinelClient['config'];
		database: DatabaseManager;

		resolveCommand(input: string, withAlias: true): { alias: string | null, command: Command | null };
		resolveCommand(input: string, withAlias?: false): Command | null;
		loadCommands(): Promise<Collection<string, Command>>;
		loadEvents(): Promise<{ [key: string]: ((...args: any[]) => void)[] }>;
		connect(): Promise<void>;
	}

	interface ClientEvents extends SentinelClientEvents { }
}