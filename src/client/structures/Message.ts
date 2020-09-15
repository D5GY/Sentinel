import { Structures, Message } from 'discord.js';
import Command from '../../util/BaseCommand';
import { INVITE_REGEX } from '../../util/Constants';
Structures.extend('Message', (DJSMessage) =>
	class Message extends DJSMessage {
		public lastCommand: LastCommandData | null = null;

		public setLastCommand(command: Command, response: Message) {
			if (!this.lastCommand) {
				this.lastCommand = {
					command,
					response,
					edits: 0
				};
			} else {
				this.lastCommand.command = command;
				this.lastCommand.response = response;
				this.lastCommand.edits++;
			}
		}

		get invites(): string[] | null {
			const invites = this.content.match(INVITE_REGEX);
			return invites ? invites.map(url => url.split('/').pop()!) : null;
		}
	}
);

interface LastCommandData {
	command: Command;
	response: Message;
	edits: number;
}

declare module 'discord.js' {
	interface Message {
		readonly invites: string[] | null;
		lastCommand: LastCommandData | null;
		setLastCommand(command: Command, response: Message): void;
	}
}