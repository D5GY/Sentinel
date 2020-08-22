import { GuildMember } from 'discord.js';
import Util from '../util';

export default async function guildMemberAdd(
	member: GuildMember
)  {
	try {
		const guildConfig = await member.guild.fetchConfig();

		if (guildConfig.memberJoinsChannel) {
			await Util.respondWith(guildConfig.memberJoinsChannel, 'MEMBER_JOINED', member);
		}
	} catch (error) {
		member.client.emit('error', error);
	}
}