import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { ReactiveCache } from '/imports/reactiveCache';
const { SimpleSchema } = require('/imports/simpleSchema');

const Integrations = new Mongo.Collection('integrations');

/**
 * Integration with third-party applications
 */
Integrations.attachSchema(
  new SimpleSchema({
    enabled: {
      /**
       * is the integration enabled?
       */
      type: Boolean,
      defaultValue: true,
    },
    title: {
      /**
       * name of the integration
       */
      type: String,
      optional: true,
    },
    type: {
      /**
       * type of the integratation (Default to 'outgoing-webhooks')
       */
      type: String,
      defaultValue: 'outgoing-webhooks',
    },
    activities: {
      /**
       * activities the integration gets triggered (list)
       */
      type: Array,
      defaultValue: ['all'],
    },
    'activities.$': {
      type: String,
    },
    url: {
      // URL validation with SSRF protection
      /**
       * URL validation regex (https://mathiasbynens.be/demo/url-regex)
       * Includes validation to block private/loopback addresses and ensure safe protocols
       */
      type: String,
      custom() {
        try {
          const u = new URL(this.value);

          // Only allow http and https protocols
          if (!['http:', 'https:'].includes(u.protocol)) {
            return 'invalidProtocol';
          }

          // Block private/loopback IP ranges and hostnames
          const hostname = u.hostname.toLowerCase();
          const blockedPatterns = [
            /^127\./, // 127.x.x.x (loopback)
            /^10\./, // 10.x.x.x (private)
            /^172\.(1[6-9]|2\d|3[01])\./, // 172.16-31.x.x (private)
            /^192\.168\./, // 192.168.x.x (private)
            /^0\./, // 0.x.x.x (current network)
            /^::1$/, // IPv6 loopback
            /^fe80:/, // IPv6 link-local
            /^fc00:/, // IPv6 unique local
            /^fd00:/, // IPv6 unique local
            /^localhost$/i,
            /\.local$/i,
            /^169\.254\./, // link-local IP
          ];

          if (blockedPatterns.some(pattern => pattern.test(hostname))) {
            return 'privateAddress';
          }
        } catch {
          return 'invalidUrl';
        }
      },
    },
    token: {
      /**
       * token of the integration
       */
      type: String,
      optional: true,
    },
    boardId: {
      /**
       * Board ID of the integration
       */
      type: String,
    },
    createdAt: {
      /**
       * Creation date of the integration
       */
      type: Date,
      // eslint-disable-next-line consistent-return
      autoValue() {
        if (this.isInsert) {
          return new Date();
        } else if (this.isUpsert) {
          return { $setOnInsert: new Date() };
        } else {
          this.unset();
        }
      },
    },
    modifiedAt: {
      type: Date,
      // eslint-disable-next-line consistent-return
      autoValue() {
        if (this.isInsert || this.isUpsert || this.isUpdate) {
          return new Date();
        } else {
          this.unset();
        }
      },
    },
    userId: {
      /**
       * user ID who created the interation
       */
      type: String,
    },
  }),
);
Integrations.Const = {
  GLOBAL_WEBHOOK_ID: '_global',
  ONEWAY: 'outgoing-webhooks',
  TWOWAY: 'bidirectional-webhooks',
  get WEBHOOK_TYPES() {
    return [this.ONEWAY, this.TWOWAY];
  },
};
export default Integrations;
