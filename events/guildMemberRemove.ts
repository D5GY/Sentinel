import { GuildMember } from 'discord.js';
import Util from '../util';

export default async function guildMemberRemove(
	member: GuildMember
)  {
	const guildConfig = await member.guild.fetchConfig();
  
	if (guildConfig.memberLeavesChannel) {
		await Util.respondWith(guildConfig.memberLeavesChannel, 'MEMBER_LEFT', member);
	}
}