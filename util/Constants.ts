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
	HELLO_WORLD: () => 'Hello world!'
};

export const CommandErrors = {
	NO_PERMISSION: () => 'You don\'t have permissions to use this command!',
	SAY_NO_ARGS: () => 'Please provide something to say!'
};

export const URLs = {
	HASTEBIN: (endpointOrID: string) => `https://paste.nomsy.net${endpointOrID ? `/${endpointOrID}` : ''}`
};