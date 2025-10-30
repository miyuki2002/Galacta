const { REST, Routes, ChannelType, PermissionFlagsBits } = require('discord.js');
const guildRepository = require('../database/guildRepository');
const initSystem = require('../services/initSystem');
const { getCommandsJson, loadCommands } = require('./commandHandler');
const logger = require('../utils/logger');

/**
 * Lưu thông tin guild vào SQLite
 * @param {Discord.Guild} guild - Guild cần lưu thông tin
 */
async function storeGuildInDB(guild) {
  try {
    const defaultSettings = {
      welcomeChannel: null,
      moderationEnabled: true,
      autoRoles: []
    };

    const defaultXp = {
      isActive: true,
      exceptions: []
    };

    guildRepository.save.run(
      guild.id,
      guild.name,
      guild.memberCount,
      guild.ownerId,
      guild.iconURL() || null,
      Date.now(),
      JSON.stringify(defaultSettings),
      JSON.stringify(defaultXp)
    );
    
    if (guild.client && guild.client.guildProfiles) {
      guild.client.guildProfiles.set(guild.id, {
        xp: defaultXp
      });
      logger.info('GUILD', `Đã lưu cấu hình XP cho guild ${guild.name} vào bộ nhớ`);
    }

    logger.info('GUILD', `Đã lưu thông tin server ${guild.name} vào SQLite`);
    return true;
  } catch (error) {
    logger.error('GUILD', `Lỗi khi lưu thông tin guild vào SQLite:`, error);
    return false;
  }
}

/**
 * Xóa thông tin guild khỏi SQLite
 * @param {string} guildId - ID của guild cần xóa
 */
async function removeGuildFromDB(guildId) {
  try {
    guildRepository.delete.run(guildId);
    logger.info('GUILD', `Đã xóa thông tin server ID: ${guildId} khỏi SQLite`);
    return true;
  } catch (error) {
    logger.error('GUILD', `Lỗi khi xóa guild từ SQLite:`, error);
    return false;
  }
}

/**
 * Lấy thông tin guild từ SQLite
 * @param {string} guildId - ID của guild cần lấy thông tin
 */
async function getGuildFromDB(guildId) {
  try {
    const guildData = guildRepository.getById.get(guildId);
    
    if (guildData) {
      // Parse JSON fields
      return {
        ...guildData,
        settings: JSON.parse(guildData.settings),
        xp: JSON.parse(guildData.xp_settings)
      };
    }
    
    return null;
  } catch (error) {
    logger.error('GUILD', `Lỗi khi lấy thông tin guild từ SQLite:`, error);
    return null;
  }
}

/**
 * Cập nhật cài đặt guild trong SQLite
 * @param {string} guildId - ID của guild cần cập nhật
 * @param {Object} settings - Đối tượng chứa cài đặt cần cập nhật
 */
async function updateGuildSettings(guildId, settings) {
  try {
    // Cập nhật cài đặt guild trong cơ sở dữ liệu
    guildRepository.updateSettings.run(
      JSON.stringify(settings),
      guildId
    );

    logger.info('GUILD', `Đã cập nhật cài đặt cho server ID: ${guildId}`);
    return true;
  } catch (error) {
    logger.error('GUILD', `Lỗi khi cập nhật cài đặt guild:`, error);
    return false;
  }
}

/**
 * Xử lý sự kiện khi bot tham gia một guild mới
 * @param {Discord.Guild} guild - Guild mới mà bot vừa tham gia
 */
async function handleGuildJoin(guild, commands) {
  logger.info('GUILD', `Bot đã được thêm vào server mới: ${guild.name} (id: ${guild.id})`);
  logger.info('GUILD', `Server hiện có ${guild.memberCount} thành viên`);

  try {
    await storeGuildInDB(guild);

    let commandsToRegister = commands;
    if (!commandsToRegister || !commandsToRegister.length) {
      commandsToRegister = getCommandsJson(guild.client);

      if (!commandsToRegister || !commandsToRegister.length) {
        logger.warn('GUILD', `Không có lệnh nào được tải để triển khai cho server ${guild.name}!`);
        commandsToRegister = [];
      }
    }

    await deployCommandsToGuild(guild.id, commandsToRegister);
    logger.info('GUILD', `Đã triển khai các lệnh slash cho server: ${guild.name}`);

    // Thông báo cho chủ sở hữu server hoặc kênh mặc định nếu có thể
    const defaultChannel = findDefaultChannel(guild);
    if (defaultChannel) {
      await defaultChannel.send({
        content: `👋 Xin chào! Bot đã sẵn sàng hỗ trợ server **${guild.name}**!\n` +
                 `🔍 Tất cả các lệnh slash đã được tự động cài đặt.\n` +
                 `💬 Bạn có thể sử dụng các lệnh slash.\n` +
                 `✨ Cảm ơn đã thêm mình vào server!`
      });
    }
  } catch (error) {
    logger.error('GUILD', `Lỗi khi xử lý guild mới:`, error);
  }
}

/**
 * Xử lý sự kiện khi bot rời khỏi một guild
 * @param {Discord.Guild} guild - Guild mà bot vừa rời khỏi
 */
function handleGuildLeave(guild) {
  logger.info('GUILD', `Bot đã rời khỏi server: ${guild.name} (id: ${guild.id})`);

  // Xóa thông tin guild khỏi SQLite
  removeGuildFromDB(guild.id);
}

/**
 * Triển khai slash commands cho một guild cụ thể
 * @param {string} guildId - ID của guild cần triển khai lệnh
 * @param {Array} commands - Mảng các lệnh cần triển khai (tùy chọn)
 */
async function deployCommandsToGuild(guildId, existingCommands = null) {
  try {
    const token = process.env.TOKEN;
    const clientId = process.env.CLIENT_ID || (existingCommands && existingCommands.client && existingCommands.client.user.id);

    if (!token) {
      throw new Error('TOKEN không được thiết lập trong biến môi trường');
    }

    if (!clientId) {
      throw new Error('CLIENT_ID không được thiết lập trong biến môi trường');
    }

    // Tạo REST client
    const rest = new REST({ version: '10' }).setToken(token);

    // Sử dụng commands từ cache hoặc từ tham số
    const commands = existingCommands || [];

    // Kiểm tra xem có lệnh nào để triển khai không
    if (!commands || commands.length === 0) {
      logger.warn('GUILD', `Không có lệnh nào để triển khai cho guild ID: ${guildId}`);
      return [];
    }

    // Triển khai lệnh đến guild cụ thể
    logger.info('GUILD', `Bắt đầu triển khai ${commands.length} lệnh đến guild ID: ${guildId}`);

    const data = await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands }
    );

    logger.info('GUILD', `Đã triển khai thành công ${data.length} lệnh đến guild ID: ${guildId}`);
    return data;
  } catch (error) {
    logger.error('GUILD', 'Lỗi khi triển khai lệnh đến guild:', error);
    throw error;
  }
}

/**
 * Tìm kênh mặc định để gửi tin nhắn chào mừng
 * @param {Discord.Guild} guild - Guild để tìm kênh mặc định
 * @returns {Discord.TextChannel|null} - Kênh văn bản mặc định hoặc null nếu không tìm thấy
 */
function findDefaultChannel(guild) {
  // Các phương pháp tìm kênh mặc định theo thứ tự ưu tiên

  // 1. Tìm kênh có tên 'general' hoặc 'chung'
  let channel = guild.channels.cache.find(
    channel => channel.type === ChannelType.GuildText &&
    (channel.name === 'general' || channel.name === 'chung') &&
    channel.permissionsFor(guild.members.me).has([
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.ViewChannel
    ])
  );

  if (channel) return channel;

  // 2. Tìm kênh mà bot có quyền gửi tin nhắn và hiển thị
  channel = guild.channels.cache.find(
    channel => channel.type === ChannelType.GuildText &&
    channel.permissionsFor(guild.members.me).has([
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.ViewChannel
    ])
  );

  return channel; // Có thể null nếu không tìm thấy kênh phù hợp
}

/**
 * Thiết lập xử lý sự kiện guild cho client
 * @param {Discord.Client} client - Discord client cần thiết lập
 * @param {Array} commands - Mảng các lệnh đã tải (tùy chọn)
 */
function setupGuildHandlers(client, commands = null) {
  const setupHandlers = async () => {
    try {
      // Tải lệnh nếu chưa được tải
      if (!commands && client.commands.size === 0) {
        logger.info('GUILD', 'Đang tải lệnh từ thư mục commands...');
        loadCommands(client);
      }

      // Sự kiện khi bot tham gia guild mới
      client.on('guildCreate', guild => handleGuildJoin(guild, commands));

      // Sự kiện khi bot rời khỏi guild
      client.on('guildDelete', guild => handleGuildLeave(guild));

      // Đồng bộ tất cả guild hiện tại vào SQLite và triển khai lệnh
      logger.info('GUILD', 'Đang đồng bộ thông tin servers với SQLite...');
      const guilds = client.guilds.cache;
      let syncCount = 0;
      let deployCount = 0;

      // Lấy danh sách lệnh từ commandHandler
      const commandsToRegister = commands || getCommandsJson(client);

      if (!commandsToRegister || commandsToRegister.length === 0) {
        logger.warn('GUILD', 'Không có lệnh nào được tải để triển khai!');
      } else {
        logger.info('GUILD', `Đã tải ${commandsToRegister.length} lệnh để triển khai cho các server`);
      }

      for (const guild of guilds.values()) {
        // Lưu thông tin guild vào SQLite
        await storeGuildInDB(guild);
        syncCount++;

        // Triển khai lệnh cho guild
        if (commandsToRegister && commandsToRegister.length > 0) {
          try {
            await deployCommandsToGuild(guild.id, commandsToRegister);
            deployCount++;
          } catch (error) {
            logger.error('GUILD', `Lỗi khi triển khai lệnh cho server ${guild.name}:`, error);
          }
        }
      }

      logger.info('GUILD', `Đã đồng bộ thành công ${syncCount}/${guilds.size} servers với SQLite`);

      if (commandsToRegister && commandsToRegister.length > 0) {
        logger.info('GUILD', `Đã triển khai lệnh thành công cho ${deployCount}/${guilds.size} servers`);
      }

    } catch (error) {
      logger.error('GUILD', 'Lỗi khi thiết lập xử lý sự kiện guild:', error);
    }
  };

  // Nếu hệ thống đã khởi tạo xong, thiết lập ngay lập tức; nếu không, đợi
  if (initSystem.getStatus().initialized) {
    setupHandlers();
  } else {
    initSystem.once('ready', setupHandlers);
  }

  logger.info('GUILD', 'Đã đăng ký handlers cho sự kiện guild');
}

// Export các hàm để sử dụng trong các file khác
module.exports = {
  handleGuildJoin,
  handleGuildLeave,
  deployCommandsToGuild,
  setupGuildHandlers,
  getGuildFromDB,
  updateGuildSettings,
  storeGuildInDB
}; 