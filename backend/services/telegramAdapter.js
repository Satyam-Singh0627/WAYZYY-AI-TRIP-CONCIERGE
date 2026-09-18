const axios = require('axios');

class TelegramAdapter {
  constructor() {
    this.token = process.env.TELEGRAM_BOT_TOKEN || '';
    this.sentMessages = [];
  }

  isLive() {
    return Boolean(this.token && this.token.trim().length > 15);
  }

  getMode() {
    return this.isLive() ? 'LIVE' : 'DEMO';
  }

  async sendMessage(chatId, text, metadata = {}) {
    const record = {
      id: `tg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      chat_id: chatId,
      text,
      metadata,
      timestamp: new Date().toISOString(),
      delivered: false,
      mode: this.getMode()
    };

    if (this.isLive()) {
      try {
        console.log(`[TelegramAdapter] Dispatching live message to Telegram chat_id=${chatId}...`);
        const url = `https://api.telegram.org/bot${this.token}/sendMessage`;
        await axios.post(url, {
          chat_id: chatId,
          text: text,
          parse_mode: 'Markdown'
        }, { timeout: 8000 });

        record.delivered = true;
        console.log('[TelegramAdapter] Live Telegram delivery successful.');
      } catch (err) {
        console.warn(`[TelegramAdapter] Telegram delivery error (${err.message}). Message recorded in demo log.`);
      }
    } else {
      // Demo simulated delivery
      record.delivered = true;
      console.log(`[TelegramAdapter] Demo simulated delivery to chat_id=${chatId} (Length: ${text.length} chars)`);
    }

    this.sentMessages.push(record);
    return record;
  }

  getRecentMessages(limit = 10) {
    return this.sentMessages.slice(-limit);
  }
}

module.exports = new TelegramAdapter();
