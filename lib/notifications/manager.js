const notifiers = require("./index");

class NotificationManager {
  #notificationConfig = {};

  /**
   * Create a notification manager
   * @param {Object} config - Notification configuration
   * @param {Object} config.statusCodes - Status codes to send notifications for
   * @param {Array<Object>} config.channels - Notification channels configuration
   */
  constructor(config = {}) {
    this.#notificationConfig = config || {};
  }

  /**
   * Check if notification should be sent for the given status code
   * @param {number} statusCode - HTTP status code
   * @returns {boolean}
   */
  shouldNotify(statusCode) {
    const { statusCodes } = this.#notificationConfig;

    if (!statusCodes) {
      return false;
    }

    // If statusCodes is an array, check if it includes the status code
    if (Array.isArray(statusCodes)) {
      return statusCodes.includes(statusCode);
    }

    // If statusCodes is a range object with min and max
    if (statusCodes.min !== undefined && statusCodes.max !== undefined) {
      return statusCode >= statusCodes.min && statusCode <= statusCodes.max;
    }

    // If statusCodes is an object with specific codes
    if (typeof statusCodes === "object") {
      return Object.values(statusCodes).includes(statusCode);
    }

    return false;
  }

  /**
   * Send notifications through configured channels
   * @param {Object} data - Request data
   * @returns {Promise<void>}
   */
  async sendNotifications(data) {
    const { statusCode } = data;

    if (!this.shouldNotify(statusCode)) {
      return;
    }

    const { channels } = this.#notificationConfig;

    if (!channels || !Array.isArray(channels) || channels.length === 0) {
      return;
    }

    const promises = [];

    for (const channel of channels) {
      const { type, options } = channel;

      if (!type || !notifiers[type]) {
        console.warn(`[Traxx] Unknown notification channel: ${type}`);
        continue;
      }

      try {
        promises.push(notifiers[type].sendNotification(options, data));
      } catch (error) {
        console.error(`[Traxx] Error sending ${type} notification:`, error);
      }
    }

    if (promises.length > 0) {
      try {
        await Promise.allSettled(promises);
      } catch (error) {
        console.error("[Traxx] Error sending notifications:", error);
      }
    }
  }
}

module.exports = NotificationManager;
