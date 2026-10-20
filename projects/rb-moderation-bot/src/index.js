import 'dotenv/config';
import { Client, EmbedBuilder, Events, GatewayIntentBits, PermissionFlagsBits, MessageFlags, REST, Routes, SlashCommandBuilder } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const warningsPath = path.join(__dirname, '..', 'data', 'warnings.json');

const required = ['DISCORD_TOKEN', 'CLIENT_ID', 'GUILD_ID'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing environment variable: ${key}`);
    process.exit(1);
  }
}

function readWarnings() {
  try {
    return JSON.parse(fs.readFileSync(warningsPath, 'utf8'));
  } catch {
    return {};
  }
}

function writeWarnings(data) {
  fs.writeFileSync(warningsPath, JSON.stringify(data, null, 2));
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

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

async function deployCommands() {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands });
}

function canModerate(actor, target) {
  if (!target || target.id === actor.id || target.id === actor.guild.ownerId) return false;
  return actor.id === actor.guild.ownerId || actor.roles.highest.comparePositionTo(target.roles.highest) > 0;
}

function baseEmbed(title, description) {
  return new EmbedBuilder().setTitle(title).setDescription(description).setColor(0xFFFFFF).setTimestamp();
}

async function logAction(guild, embed) {
  if (!process.env.MOD_LOG_CHANNEL_ID) return;
  const channel = guild.channels.cache.get(process.env.MOD_LOG_CHANNEL_ID);
  if (channel?.isTextBased()) await channel.send({ embeds: [embed] }).catch(() => null);
}

client.once(Events.ClientReady, async readyClient => {
  console.log(`${readyClient.user.tag} aktif.`);
  try {
    await deployCommands();
    console.log('Slash komutlar güncellendi.');
  } catch (error) {
    console.error('Komutlar yüklenemedi:', error);
  }
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand() || !interaction.inGuild()) return;
  try {

  const member = interaction.member;

  if (interaction.commandName === 'ban') {
    const user = interaction.options.getUser('uye', true);
    const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi';
    const target = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!target) return interaction.reply({ content: 'Üye bulunamadı.', flags: MessageFlags.Ephemeral });
    if (!canModerate(interaction.member, target)) return interaction.reply({content:'Üyeye işlem yapma yetkin yok.',flags:MessageFlags.Ephemeral});
    if (!target.bannable) return interaction.reply({content:'Botun üye üzerinde yetkisi yok; rol sırasını kontrol et.',flags:MessageFlags.Ephemeral});
    await target.ban({ reason });
    const embed = baseEmbed('🔨 Ban', `${user.tag} yasaklandı.`).addFields({ name: 'Sebep', value: reason }, { name: 'Yetkili', value: `${interaction.user.tag}` });
    await interaction.reply({ embeds: [embed] });
    return logAction(interaction.guild, embed);
  }

  if (interaction.commandName === 'kick') {
    const user = interaction.options.getUser('uye', true);
    const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi';
    const target = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!target) return interaction.reply({ content: 'Üye bulunamadı.', flags: MessageFlags.Ephemeral });
    if (!canModerate(interaction.member, target)) return interaction.reply({content:'Üyeye işlem yapma yetkin yok.',flags:MessageFlags.Ephemeral});
    if (!target.kickable) return interaction.reply({content:'Botun üye üzerinde yetkisi yok; rol sırasını kontrol et.',flags:MessageFlags.Ephemeral});
    await target.kick(reason);
    const embed = baseEmbed('👢 Kick', `${user.tag} sunucudan atıldı.`).addFields({ name: 'Sebep', value: reason }, { name: 'Yetkili', value: `${interaction.user.tag}` });
    await interaction.reply({ embeds: [embed] });
    return logAction(interaction.guild, embed);
  }

  if (interaction.commandName === 'timeout') {
    const user = interaction.options.getUser('uye', true);
    const minutes = interaction.options.getInteger('dakika', true);
    const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi';
    const target = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!target) return interaction.reply({ content: 'Üye bulunamadı.', flags: MessageFlags.Ephemeral });
    if (!canModerate(interaction.member, target)) return interaction.reply({content:'Üyeye işlem yapma yetkin yok.',flags:MessageFlags.Ephemeral});
    if (!target.moderatable) return interaction.reply({content:'Botun üye üzerinde yetkisi yok; rol sırasını kontrol et.',flags:MessageFlags.Ephemeral});
    await target.timeout(minutes * 60 * 1000, reason);
    const embed = baseEmbed('⏳ Timeout', `${user.tag} timeout aldı.`)
      .addFields({ name: 'Süre', value: `${minutes} dakika` }, { name: 'Sebep', value: reason }, { name: 'Yetkili', value: `${interaction.user.tag}` });
    await interaction.reply({ embeds: [embed] });
    return logAction(interaction.guild, embed);
  }

  if (interaction.commandName === 'untimeout') {
    const user = interaction.options.getUser('uye', true);
    const target = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!target) return interaction.reply({ content: 'Üye bulunamadı.', flags: MessageFlags.Ephemeral });
    if (!canModerate(interaction.member, target)) return interaction.reply({content:'Üyeye işlem yapma yetkin yok.',flags:MessageFlags.Ephemeral});
    if (!target.moderatable) return interaction.reply({content:'Botun üye üzerinde yetkisi yok; rol sırasını kontrol et.',flags:MessageFlags.Ephemeral});
    await target.timeout(null);
    const embed = baseEmbed('✅ Timeout Kaldırıldı', `${user.tag} artık timeout altında değil.`).addFields({ name: 'Yetkili', value: `${interaction.user.tag}` });
    await interaction.reply({ embeds: [embed] });
    return logAction(interaction.guild, embed);
  }

  if (interaction.commandName === 'warn') {
    const user = interaction.options.getUser('uye', true);
    const reason = interaction.options.getString('sebep', true);
    const target = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!canModerate(interaction.member, target)) return interaction.reply({content:'Bu üyeyi uyaramazsın.',flags:MessageFlags.Ephemeral});
    const data = readWarnings();
    if (!data[interaction.guild.id]) data[interaction.guild.id] = {};
    if (!data[interaction.guild.id][user.id]) data[interaction.guild.id][user.id] = [];
    data[interaction.guild.id][user.id].push({ reason, moderator: interaction.user.tag, at: new Date().toISOString() });
    writeWarnings(data);
    const total = data[interaction.guild.id][user.id].length;
    const embed = baseEmbed('⚠️ Uyarı Verildi', `${user.tag} uyarıldı.`)
      .addFields({ name: 'Sebep', value: reason }, { name: 'Toplam Uyarı', value: String(total) }, { name: 'Yetkili', value: interaction.user.tag });
    await interaction.reply({ embeds: [embed] });
    return logAction(interaction.guild, embed);
  }

  if (interaction.commandName === 'warnings') {
    const user = interaction.options.getUser('uye', true);
    const data = readWarnings();
    const warnings = data[interaction.guild.id]?.[user.id] || [];
    const description = warnings.length
      ? warnings.map((entry, index) => `**${index + 1}.** ${entry.reason}\nYetkili: ${entry.moderator}\nTarih: <t:${Math.floor(new Date(entry.at).getTime()/1000)}:f>`).join('\n\n')
      : 'Bu kullanıcı için kayıtlı uyarı yok.';
    return interaction.reply({ embeds: [baseEmbed(`📋 ${user.tag} Uyarıları`, description.slice(0,3900))] });
  }

  if (interaction.commandName === 'clear') {
    const amount = interaction.options.getInteger('adet', true);
    const messages = await interaction.channel.bulkDelete(amount, true);
    return interaction.reply({ embeds: [baseEmbed('🧹 Temizlik Tamamlandı', `${messages.size} mesaj silindi.`)], flags: MessageFlags.Ephemeral });
  }
  } catch (error) {
    console.error('Moderation error:', error);
    const response = {content:'İşlem başarısız oldu. Bot yetkilerini ve rol hiyerarşisini kontrol et.',flags:MessageFlags.Ephemeral};
    if (interaction.deferred || interaction.replied) await interaction.followUp(response).catch(console.error);
    else await interaction.reply(response).catch(console.error);
  }
});

client.on(Events.Error, console.error);
client.login(process.env.DISCORD_TOKEN).catch(console.error);
