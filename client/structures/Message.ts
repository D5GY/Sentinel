import { Structures, Message } from 'discord.js';
import Command from '../../util/BaseCommand';
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
	}
);

interface LastCommandData {
	command: Command;
	response: Message;
	edits: number;
}

declare module 'discord.js' {
	interface Message {
		lastCommand: LastCommandData | null;
		setLastCommand(command: Command, response: Message): void;
	}
}