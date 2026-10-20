import 'dotenv/config';
import { ChannelType, Client, EmbedBuilder, Events, GatewayIntentBits, PermissionFlagsBits, MessageFlags, REST, Routes, SlashCommandBuilder } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.join(__dirname, '..', 'data', 'config.json');

const required = ['DISCORD_TOKEN', 'CLIENT_ID', 'GUILD_ID'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing environment variable: ${key}`);
    process.exit(1);
  }
}

function readConfig() {
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch {
    return {};
  }
}

function writeConfig(data) {
  fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
}

function getGuildConfig(guildId) {
  const data = readConfig();
  if (!data[guildId]) data[guildId] = { welcomeChannelId: null, goodbyeChannelId: null, autoRoleIds: [] };
  writeConfig(data);
  return data[guildId];
}

function updateGuildConfig(guildId, updater) {
  const data = readConfig();
  if (!data[guildId]) data[guildId] = { welcomeChannelId: null, goodbyeChannelId: null, autoRoleIds: [] };
  updater(data[guildId]);
  writeConfig(data);
  return data[guildId];
}

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

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

async function deployCommands() {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands });
}

function embed(title, description) {
  return new EmbedBuilder().setTitle(title).setDescription(description).setColor(0xFFFFFF).setTimestamp();
}

client.once(Events.ClientReady, async readyClient => {
  console.log(`${readyClient.user.tag} aktif.`);
  try {
    await deployCommands();
    console.log('Slash komutlar güncellendi.');
  } catch (error) {
    console.error('Komutlar deploy edilemedi:', error);
  }
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand() || !interaction.inGuild()) return;
  try {

  if (interaction.commandName === 'setup-welcome') {
    const channel = interaction.options.getChannel('kanal', true);
    updateGuildConfig(interaction.guild.id, config => {
      config.welcomeChannelId = channel.id;
    });
    return interaction.reply({ embeds: [embed('👋 Karşılama Ayarlandı', `Karşılama kanalı ${channel} olarak ayarlandı.`)], flags: MessageFlags.Ephemeral });
  }

  if (interaction.commandName === 'setup-goodbye') {
    const channel = interaction.options.getChannel('kanal', true);
    updateGuildConfig(interaction.guild.id, config => {
      config.goodbyeChannelId = channel.id;
    });
    return interaction.reply({ embeds: [embed('👋 Ayrılma Ayarlandı', `Ayrılma kanalı ${channel} olarak ayarlandı.`)], flags: MessageFlags.Ephemeral });
  }

  if (interaction.commandName === 'autorole-add') {
    const role = interaction.options.getRole('rol', true);
    const bot = interaction.guild.members.me ?? await interaction.guild.members.fetchMe();
    if (role.managed || role.id === interaction.guild.id || role.position >= bot.roles.highest.position) return interaction.reply({content:'Bot bu rolü veremez. Botun rolü daha yukarıda olmalı.',flags:MessageFlags.Ephemeral});
    const config = updateGuildConfig(interaction.guild.id, data => {
      if (!data.autoRoleIds.includes(role.id)) data.autoRoleIds.push(role.id);
    });
    return interaction.reply({ embeds: [embed('➕ Autorole Eklendi', `${role} artık yeni üyelere verilecek. Toplam: ${config.autoRoleIds.length}`)], flags: MessageFlags.Ephemeral });
  }

  if (interaction.commandName === 'autorole-remove') {
    const role = interaction.options.getRole('rol', true);
    const config = updateGuildConfig(interaction.guild.id, data => {
      data.autoRoleIds = data.autoRoleIds.filter(id => id !== role.id);
    });
    return interaction.reply({ embeds: [embed('➖ Autorole Kaldırıldı', `${role} artık verilmeyecek. Toplam: ${config.autoRoleIds.length}`)], flags: MessageFlags.Ephemeral });
  }

  if (interaction.commandName === 'autorole-list') {
    const config = getGuildConfig(interaction.guild.id);
    const roles = config.autoRoleIds.length ? config.autoRoleIds.map(id => `<@&${id}>`).join(', ') : 'Henüz rol tanımlanmadı.';
    return interaction.reply({ embeds: [embed('📜 Autorole Listesi', roles)], flags: MessageFlags.Ephemeral });
  }
  } catch (error) {
    console.error('Ayar hatası:',error);
    const payload = {content:'Ayar kaydedilemedi; bot yetkilerini kontrol et.', flags:MessageFlags.Ephemeral};
    if (interaction.replied || interaction.deferred) await interaction.followUp(payload).catch(console.error);
    else await interaction.reply(payload).catch(console.error);
  }
});

client.on(Events.GuildMemberAdd, async member => {
  const config = getGuildConfig(member.guild.id);

  for (const roleId of config.autoRoleIds || []) {
    const role = member.guild.roles.cache.get(roleId);
    if (role) await member.roles.add(role).catch(() => null);
  }

  if (config.welcomeChannelId) {
    const channel = member.guild.channels.cache.get(config.welcomeChannelId);
    if (channel?.isTextBased()) {
      await channel.send({
        embeds: [embed('🎉 Hoş Geldin!', `${member} sunucuya katıldı. Sunucuda artık **${member.guild.memberCount}** kişi var.`)]
      }).catch(() => null);
    }
  }
});

client.on(Events.GuildMemberRemove, async member => {
  const config = getGuildConfig(member.guild.id);
  if (!config.goodbyeChannelId) return;
  const channel = member.guild.channels.cache.get(config.goodbyeChannelId);
  if (channel?.isTextBased()) {
    await channel.send({
      embeds: [embed('😢 Görüşürüz!', `**${member.user.tag}** sunucudan ayrıldı.`)]
    }).catch(() => null);
  }
});

client.on(Events.Error, console.error);
client.login(process.env.DISCORD_TOKEN).catch(console.error);
