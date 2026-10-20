import 'dotenv/config';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, Client, EmbedBuilder, Events, GatewayIntentBits, ModalBuilder, Partials, PermissionFlagsBits, PermissionsBitField, MessageFlags, REST, Routes, SlashCommandBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';

const required = ['DISCORD_TOKEN', 'CLIENT_ID', 'GUILD_ID'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing environment variable: ${key}`);
    process.exit(1);
  }
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  partials: [Partials.Channel]
});

const commands = [
  new SlashCommandBuilder()
    .setName('support-panel')
    .setDescription('Destek panelini gönderir').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption(option =>
      option.setName('kanal')
        .setDescription('Panelin gönderileceği kanal')
        .setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName('close-ticket')
    .setDescription('Aktif ticket kanalını kapatır')
].map(command => command.toJSON());

async function deployCommands() {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  await rest.put(
    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
    { body: commands }
  );
}

function buildPanelEmbed() {
  return new EmbedBuilder()
    .setTitle('🎫 Destek Merkezi')
    .setDescription('Yardıma ihtiyacın varsa aşağıdaki butona tıkla ve ticket oluştur.')
    .addFields(
      { name: 'Ne işe yarar?', value: 'Destek talebini düzenli ve hızlı biçimde iletmeni sağlar.' },
      { name: 'Not', value: 'Spam veya gereksiz ticket açma.' }
    )
    .setColor(0xFFFFFF)
    .setFooter({ text: 'Reapbone Support Bot' })
    .setTimestamp();
}

function buildTicketEmbed(user, issue) {
  return new EmbedBuilder()
    .setTitle('📩 Yeni Destek Talebi')
    .setDescription(`Kullanıcı: ${user}`)
    .addFields({ name: 'Sorun', value: issue })
    .setColor(0xFFFFFF)
    .setTimestamp();
}

function ticketControls() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket-claim').setLabel('Claim').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('ticket-close').setLabel('Kapat').setStyle(ButtonStyle.Danger)
  );
}

async function sendLog(guild, embed) {
  if (!process.env.LOG_CHANNEL_ID) return;
  const channel = guild.channels.cache.get(process.env.LOG_CHANNEL_ID);
  if (channel?.isTextBased()) await channel.send({ embeds: [embed] }).catch(() => null);
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
  if (!interaction.inGuild()) return;
  try {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'support-panel') {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) return interaction.reply({content:'Sunucuyu Yönet yetkin yok.',flags:MessageFlags.Ephemeral});
      const targetChannel = interaction.options.getChannel('kanal') || interaction.channel;
      if (!targetChannel?.permissionsFor(interaction.guild.members.me)?.has(PermissionFlagsBits.SendMessages)) return interaction.reply({content:'Bot seçilen kanala mesaj gönderemiyor.',flags:MessageFlags.Ephemeral});
      if (!targetChannel?.isTextBased()) {
        return interaction.reply({ content: 'Geçerli bir yazı kanalı seç.', flags: MessageFlags.Ephemeral });
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('open-ticket')
          .setLabel('Destek Talebi Aç')
          .setStyle(ButtonStyle.Primary)
      );

      await targetChannel.send({ embeds: [buildPanelEmbed()], components: [row] });
      return interaction.reply({ content: 'Destek paneli gönderildi.', flags: MessageFlags.Ephemeral });
    }

    if (interaction.commandName === 'close-ticket') {
      if (!interaction.channel?.topic?.startsWith('ticket-owner:')) {
        return interaction.reply({ content: 'Bu komut sadece ticket kanallarında kullanılabilir.', flags: MessageFlags.Ephemeral });
      }

      const ownerId = interaction.channel.topic.slice('ticket-owner:'.length);
      const isStaff = process.env.STAFF_ROLE_ID && interaction.member.roles.cache.has(process.env.STAFF_ROLE_ID);
      if (interaction.user.id !== ownerId && !isStaff && !interaction.memberPermissions.has(PermissionFlagsBits.ManageChannels)) return interaction.reply({content:'Bu ticket için iznin yok.',flags:MessageFlags.Ephemeral});
      await interaction.reply({ content: 'Ticket 5 saniye içinde kapatılacak...' });
      setTimeout(async () => {
        await interaction.channel.delete('Ticket kapatıldı').catch(console.error);
      }, 5000);
      return;
    }
  }

  if (interaction.isButton() && interaction.customId === 'open-ticket') {
    const modal = new ModalBuilder().setCustomId('ticket-modal').setTitle('Destek Talebi');
    const issueInput = new TextInputBuilder()
      .setCustomId('ticket-issue')
      .setLabel('Sorunun nedir?')
      .setStyle(TextInputStyle.Paragraph)
      .setMinLength(10)
      .setMaxLength(500)
      .setPlaceholder('Sorunu mümkün olduğunca açık yaz.')
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(issueInput));
    return interaction.showModal(modal);
  }

  if (interaction.isModalSubmit() && interaction.customId === 'ticket-modal') {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const issue = interaction.fields.getTextInputValue('ticket-issue');
    const guild = interaction.guild;
    if (!guild.members.me?.permissions.has(PermissionFlagsBits.ManageChannels)) return interaction.editReply('Botun Kanalları Yönet izni yok.');
    const user = interaction.user;

    const channelName = `ticket-${user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 90);
    const permissionOverwrites = [
      { id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
      { id: user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] }
    ];

    if (process.env.STAFF_ROLE_ID) {
      permissionOverwrites.push({
        id: process.env.STAFF_ROLE_ID,
        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory]
      });
    }

    const allChannels = await guild.channels.fetch();
    const alreadyOpen = allChannels.find(ch => ch?.topic === `ticket-owner:${user.id}`);
    if (alreadyOpen) return interaction.editReply({content:`Zaten açık bir ticket'ın var: ${alreadyOpen}`});
    const channel = await guild.channels.create({
      name: channelName || `ticket-${user.id}`,
      type: ChannelType.GuildText,
      parent: process.env.TICKET_CATEGORY_ID || null,
      permissionOverwrites,
      topic: `ticket-owner:${user.id}`
    });

    await channel.send({
      content: process.env.STAFF_ROLE_ID ? `<@&${process.env.STAFF_ROLE_ID}> ${user}` : `${user}`,
      embeds: [buildTicketEmbed(user, issue)],
      components: [ticketControls()]
    });

    await sendLog(guild, new EmbedBuilder()
      .setTitle('📝 Ticket Açıldı')
      .setDescription(`${user} tarafından ${channel} oluşturuldu.`)
      .addFields({ name: 'Sorun', value: issue })
      .setColor(0xFFFFFF)
      .setTimestamp());

    return interaction.editReply({ content: `Ticket oluşturuldu: ${channel}` });
  }

  if (interaction.isButton() && interaction.customId === 'ticket-claim') {
    const isStaff = process.env.STAFF_ROLE_ID && interaction.member.roles.cache.has(process.env.STAFF_ROLE_ID);
    if (!interaction.channel?.topic?.startsWith('ticket-owner:') || (!isStaff && !interaction.memberPermissions.has(PermissionFlagsBits.ManageChannels))) return interaction.reply({content:'Yalnızca destek ekibi claim yapabilir.',flags:MessageFlags.Ephemeral});
    await interaction.reply({
      embeds: [new EmbedBuilder().setDescription(`✅ ${interaction.user} bu ticket ile ilgileniyor.`).setColor(0xFFFFFF)],
      ephemeral: false
    });
    return sendLog(interaction.guild, new EmbedBuilder()
      .setTitle('🙋 Ticket Claim')
      .setDescription(`${interaction.user} bir ticket claim etti.`)
      .setColor(0xFFFFFF)
      .setTimestamp());
  }

  if (interaction.isButton() && interaction.customId === 'ticket-close') {
    const ownerId = interaction.channel?.topic?.startsWith('ticket-owner:') ? interaction.channel.topic.slice(13) : null;
    const isStaff = process.env.STAFF_ROLE_ID && interaction.member.roles.cache.has(process.env.STAFF_ROLE_ID);
    if (!ownerId || (interaction.user.id !== ownerId && !isStaff && !interaction.memberPermissions.has(PermissionFlagsBits.ManageChannels))) return interaction.reply({content:'Bu ticketı kapatamazsın.',flags:MessageFlags.Ephemeral});
    await interaction.reply({ content: 'Ticket 5 saniye içinde kapatılacak...' });
    return setTimeout(async () => {
      await interaction.channel.delete('Ticket kapatıldı').catch(console.error);
    }, 5000);
  }
  } catch (error) {
    console.error('Ticket hatası:', error);
    const payload = { content: 'İşlem başarısız oldu. Bot izinlerini ve kanal/rol ayarlarını kontrol et.', flags: MessageFlags.Ephemeral };
    if (interaction.deferred && !interaction.replied) await interaction.editReply(payload).catch(console.error);
    else if (interaction.deferred || interaction.replied) await interaction.followUp(payload).catch(console.error);
    else await interaction.reply(payload).catch(console.error);
  }
});

client.on(Events.Error, console.error);
client.login(process.env.DISCORD_TOKEN).catch(console.error);
