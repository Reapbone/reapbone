import 'dotenv/config';
import { PermissionFlagsBits, REST, Routes, SlashCommandBuilder } from 'discord.js';

const commands = [
  new SlashCommandBuilder()
    .setName('support-panel')
    .setDescription('Destek panelini gönderir').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption(option =>
      option.setName('kanal').setDescription('Panelin gönderileceği kanal').setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName('close-ticket')
    .setDescription('Aktif ticket kanalını kapatır')
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
