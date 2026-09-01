const NODEMAILER_MAIL_SERVICES = [
  '126', '163', '1und1', 'AOL', 'Aliyun', 'AliyunQiye', 'Aruba', 'BOL',
  'Bluewin', 'DebugMail', 'Disroot', 'DynectEmail', 'ElasticEmail', 'Ethereal',
  'FastMail', 'Feishu Mail', 'Forward Email', 'GMX', 'GandiMail', 'Gmail',
  'GmailWorkspace', 'Godaddy', 'GodaddyAsia', 'GodaddyEurope', 'Hotmail',
  'Infomaniak', 'KolabNow', 'Loopia', 'Loops', 'Mail.ru', 'Mailcatch.app',
  'Maildev', 'MailerSend', 'Mailgun', 'Mailjet', 'Mailosaur', 'Mailtrap',
  'Mandrill', 'Naver', 'OhMySMTP', 'One', 'OpenMailBox', 'Outlook365',
  'Postmark', 'Proton', 'QQ', 'QQex', 'Resend', 'Runbox', 'SES',
  'SES-AP-NORTHEAST-1', 'SES-AP-NORTHEAST-2', 'SES-AP-NORTHEAST-3',
  'SES-AP-SOUTH-1', 'SES-AP-SOUTHEAST-1', 'SES-AP-SOUTHEAST-2',
  'SES-CA-CENTRAL-1', 'SES-EU-CENTRAL-1', 'SES-EU-NORTH-1',
  'SES-EU-WEST-1', 'SES-EU-WEST-2', 'SES-EU-WEST-3', 'SES-SA-EAST-1',
  'SES-US-EAST-1', 'SES-US-EAST-2', 'SES-US-GOV-EAST-1',
  'SES-US-GOV-WEST-1', 'SES-US-WEST-1', 'SES-US-WEST-2', 'SMTP2GO',
  'SendCloud', 'SendGrid', 'SendPulse', 'SendinBlue', 'Seznam', 'Sparkpost',
  'Tipimail', 'Tutanota', 'Yahoo', 'Yandex', 'Zimbra', 'Zoho', 'hot.ee',
  'iCloud', 'mail.ee', 'qiye.aliyun',
];

const ALL_MAIL_SERVICES = ['SMTP', ...NODEMAILER_MAIL_SERVICES];

function isSupportedMailService(service) {
  return ALL_MAIL_SERVICES.includes(service);
}

function mailServiceStorageKey(service) {
  return service.replaceAll('.', '\uff0e');
}

module.exports = {
  ALL_MAIL_SERVICES,
  NODEMAILER_MAIL_SERVICES,
  isSupportedMailService,
  mailServiceStorageKey,
};
