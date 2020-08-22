import { GuildMember } from 'discord.js';
import Util from '../util';

export default async function guildMemberAdd(
	member: GuildMember
)  {
	const guildConfig = await member.guild.fetchConfig();

	if (guildConfig.memberJoinsChannel) {
		await Util.respondWith(guildConfig.memberJoinsChannel, 'MEMBER_JOINED', member);
	}
}