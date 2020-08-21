import SentinelClient, { SentinelConfig } from './client/SentinelClient';
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
		presence: { activity: {
			name: `Sentinel ${packageJSON ? `v${packageJSON.version}` : 'Unknown Version'}`
		} }
	}
);
client.on('error', console.error);
client.on('warn', console.warn);
if (config.PRODUCTION) client.on('debug', console.log);
client.connect();