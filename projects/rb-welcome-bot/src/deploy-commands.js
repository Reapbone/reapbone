import 'dotenv/config';
import { ChannelType, PermissionFlagsBits, REST, Routes, SlashCommandBuilder } from 'discord.js';

const commands = [
  new SlashCommandBuilder().setName('setup-welcome').setDescription('Karşılama kanalını ayarlar')
    .addChannelOption(option => option.setName('kanal').setDescription('Karşılama kanalı').addChannelTypes(ChannelType.GuildText).setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  new SlashCommandBuilder().setName('setup-goodbye').setDescription('Ayrılma kanalını ayarlar')
    .addChannelOption(option => option.setName('kanal').setDescription('Ayrılma kanalı').addChannelTypes(ChannelType.GuildText).setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  new SlashCommandBuilder().setName('autorole-add').setDescription('Otomatik rol ekler')
    .addRoleOption(option => option.setName('rol').setDescription('Otomatik verilecek rol').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  new SlashCommandBuilder().setName('autorole-remove').setDescription('Otomatik rolü kaldırır')
    .addRoleOption(option => option.setName('rol').setDescription('Kaldırılacak rol').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  new SlashCommandBuilder().setName('autorole-list').setDescription('Otomatik roller listesini gösterir')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

try {
  console.log('Slash komutlar yükleniyor...');
  await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands });
  console.log('Slash komutlar başarıyla yüklendi.');
} catch (error) {
  console.error(error);
  process.exit(1);
}
