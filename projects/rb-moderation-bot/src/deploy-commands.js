import 'dotenv/config';
import { PermissionFlagsBits, REST, Routes, SlashCommandBuilder } from 'discord.js';

const commands = [
  new SlashCommandBuilder().setName('ban').setDescription('Üyeyi yasaklar')
    .addUserOption(option => option.setName('uye').setDescription('Yasaklanacak üye').setRequired(true))
    .addStringOption(option => option.setName('sebep').setDescription('Sebep').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  new SlashCommandBuilder().setName('kick').setDescription('Üyeyi atar')
    .addUserOption(option => option.setName('uye').setDescription('Atılacak üye').setRequired(true))
    .addStringOption(option => option.setName('sebep').setDescription('Sebep').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  new SlashCommandBuilder().setName('timeout').setDescription('Üyeye timeout uygular')
    .addUserOption(option => option.setName('uye').setDescription('Timeout uygulanacak üye').setRequired(true))
    .addIntegerOption(option => option.setName('dakika').setDescription('Süre (dakika)').setRequired(true).setMinValue(1).setMaxValue(40320))
    .addStringOption(option => option.setName('sebep').setDescription('Sebep').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  new SlashCommandBuilder().setName('untimeout').setDescription('Üyenin timeout cezasını kaldırır')
    .addUserOption(option => option.setName('uye').setDescription('Üye').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  new SlashCommandBuilder().setName('warn').setDescription('Üyeye uyarı ekler')
    .addUserOption(option => option.setName('uye').setDescription('Üye').setRequired(true))
    .addStringOption(option => option.setName('sebep').setDescription('Sebep').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  new SlashCommandBuilder().setName('warnings').setDescription('Üyenin uyarılarını listeler')
    .addUserOption(option => option.setName('uye').setDescription('Üye').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  new SlashCommandBuilder().setName('clear').setDescription('Mesaj siler')
    .addIntegerOption(option => option.setName('adet').setDescription('Silinecek mesaj sayısı').setRequired(true).setMinValue(1).setMaxValue(100))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
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
