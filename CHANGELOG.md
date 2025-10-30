# Changelog

Tất cả thay đổi đáng chú ý cho dự án này sẽ được ghi tại đây.

## [Unreleased]
- Cập nhật discord.js v14 syntax:
  - `interaction.isCommand()` → `interaction.isChatInputCommand()`
  - Dùng `ChannelType.GuildText` thay cho số nguyên loại kênh
  - Dùng `PermissionFlagsBits.SendMessages` và `PermissionFlagsBits.ViewChannel`

## [1.0.2] - 2025-10-30
- Phát hành bản ổn định ban đầu
- Lưu trữ SQLite: team messages, user history, guild settings
- Tự động triển khai slash commands khi bot tham gia guild
- Hệ thống team finding và cập nhật theo voice state


