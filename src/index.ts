import SentinelClient, { SentinelConfig } from './client/SentinelClient';
import { Intents } from 'discord.js';
import * as path from 'path';
for (const structure of ['Guild', 'Message']) {
	require(path.join(
		__dirname, 'client', 'structures', structure
	));
}
let packageJSON: { version: string } | undefined;
try {
	packageJSON = require('../package.json');
} catch {
	try {
		packageJSON = require('./package.json');
	} catch {
		console.warn('Couldn\'t find package.json');
	}
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const config: SentinelConfig = require('./config.json');

const client = new SentinelClient(
	config, {
		allowedMentions: { parse: [] },
		partials: ['MESSAGE'],
		presence: {
			activity: {
				name: `Sentinel ${packageJSON ? `v${packageJSON.version}` : 'Unknown Version'}`
			}
		},
		ws: {
			intents: [
				Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS,
				Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_PRESENCES
			]
		}
	}
);
client.on('ready', () => {
	console.log(`${client.user!.tag} Is online`);
});
client.on('error', console.error);
client.on('warn', console.warn);
if (config.PRODUCTION) client.on('debug', console.info);
client.connect();
