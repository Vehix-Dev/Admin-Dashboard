
export type EmailTemplateType =
  | 'PROMOTION'
  | 'WALLET_UPDATE'
  | 'GENERAL'
  | 'WELCOME'
  | 'SERVICE_COMPLETED'
  | 'ACCOUNT_APPROVED'
  | 'WELCOME_APPROVAL';

interface BaseTemplateData {
  subject: string;
  previewText?: string;
}

interface PromotionData extends BaseTemplateData {
  title: string;
  body: string;
  imageUrl?: string;
  ctaText?: string;
  ctaLink?: string;
}

interface WalletData extends BaseTemplateData {
  userName: string;
  amount: string;
  newBalance: string;
  transactionType: 'CREDIT' | 'DEBIT';
  description?: string;
  date?: string;
  transactionId?: string;
}

interface GeneralData extends BaseTemplateData {
  title: string;
  body: string;
}

interface WelcomeData extends BaseTemplateData {
  userName: string;
  role: string;
  loginUrl?: string;
}

interface ServiceCompletedData extends BaseTemplateData {
  userName: string;
  serviceId: string;
  serviceName: string;
  completedDate: string;
  ratingUrl?: string;
}

interface AccountApprovedData extends BaseTemplateData {
  userName: string;
  role: string;
  loginUrl?: string;
}

// Brand Colors
const COLORS = {
  primary: '#EA5E2A', // Orange
  primaryDark: '#D55325', // Darker Orange
  secondary: '#1C2D47', // Navy Blue
  background: '#F0F2F5', // Light Gray Background
  white: '#ffffff',
  text: '#1C2B43', // Dark Navy Text
  muted: '#64748b', // Slate 500
  border: '#e2e8f0'
};

// Logo Configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://vehix-platform.com';
const LOGO_URL = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/vehix-logo.jpg`
  : 'https://placehold.co/200x50/EA5E2A/ffffff?text=Vehix';

const BaseLayout = (content: string, previewText: string = '') => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${previewText}</title>
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: ${COLORS.background}; color: ${COLORS.text}; }
    .container { max-width: 600px; margin: 40px auto; background-color: ${COLORS.white}; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); }
    .header { background-color: ${COLORS.secondary}; padding: 30px 40px; text-align: center; border-bottom: 4px solid ${COLORS.primary}; }
    .logo-container { background-color: white; padding: 10px 20px; border-radius: 8px; display: inline-block; }
    .logo { height: 40px; display: block; }
    .content { padding: 40px 40px; color: ${COLORS.text}; line-height: 1.6; font-size: 16px; }
    .footer { background-color: ${COLORS.background}; padding: 30px; text-align: center; color: ${COLORS.muted}; font-size: 12px; border-top: 1px solid ${COLORS.border}; }
    .btn { display: inline-block; background-color: ${COLORS.primary}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 24px; text-align: center; min-width: 150px; }
    .btn:hover { background-color: ${COLORS.primaryDark}; }
    h1 { color: ${COLORS.secondary}; margin-top: 0; margin-bottom: 24px; font-size: 24px; font-weight: 700; }
    h2 { color: ${COLORS.secondary}; margin-top: 20px; margin-bottom: 16px; font-size: 20px; }
    p { margin-bottom: 16px; }
    .amount-box { padding: 24px; background-color: #FFFAF0; border-radius: 8px; text-align: center; margin: 30px 0; border: 1px solid ${COLORS.primary}40; }
    .amount-label { font-size: 14px; color: ${COLORS.muted}; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin-bottom: 8px; }
    .amount-value { font-size: 36px; font-weight: 800; color: ${COLORS.primary}; letter-spacing: -1px; }
    .amount-value.debit { color: #ef4444; }
    .info-box { background-color: #F8FAFC; border-left: 4px solid ${COLORS.primary}; padding: 15px; margin: 20px 0; border-radius: 0 4px 4px 0; }
    .details-table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
    .details-table td { padding: 12px 10px; border-bottom: 1px solid ${COLORS.border}; }
    .details-table tr:last-child td { border-bottom: none; }
    .details-label { color: ${COLORS.muted}; font-weight: 600; width: 40%; }

    .details-value { color: ${COLORS.secondary}; text-align: right; font-weight: 500; }
    .info-box { background-color: #ecfdf5; border-left: 4px solid ${COLORS.primary}; padding: 16px; margin: 24px 0; border-radius: 4px; color: #065f46; font-size: 14px; }
    
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; border-radius: 0; margin: 0; }
      .content { padding: 30px 20px; }
      .header { padding: 20px; }
    }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${previewText}
  </div>
  <div class="container">
    <div class="header">
      <div class="logo-container">
        <img src="${LOGO_URL}" alt="Vehix" class="logo" />
      </div>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Vehix Platform. All rights reserved.</p>
      <p>Kampala, Uganda</p>
      <p>Need help? <a href="mailto:support@vehix.com" style="color: ${COLORS.primary}; text-decoration: none;">Contact Support</a></p>
    </div>
  </div>
</body>
</html>
`;

export const getPromotionTemplate = (data: PromotionData) => {
  const imageHtml = data.imageUrl
    ? `<div style="margin: -40px -40px 30px -40px;">
         <img src="${data.imageUrl}" alt="Promotion" style="width: 100%; display: block;" />
       </div>`
    : '';

  const ctaHtml = data.ctaLink && data.ctaText
    ? `<div style="text-align: center;"><a href="${data.ctaLink}" class="btn">${data.ctaText}</a></div>`
    : '';

  const content = `
    ${imageHtml}
    <h1 style="text-align: center;">${data.title}</h1>
    <div style="color: #4b5563;">
      ${data.body.replace(/\n/g, '<br/>')}
    </div>
    ${ctaHtml}
  `;

  return BaseLayout(content, data.previewText || data.title);
};

export const getWalletTemplate = (data: WalletData) => {
  const isCredit = data.transactionType === 'CREDIT';

  const content = `
    <h1>Wallet Update</h1>
    <p>Hello <strong>${data.userName}</strong>,</p>
    <p>Your wallet balance has been successfully updated. Here are the details of the transaction:</p>
    
    <div class="amount-box">
      <div class="amount-label">${isCredit ? 'Amount Credited' : 'Amount Debited'}</div>
      <div class="amount-value ${!isCredit ? 'debit' : ''}">
        ${isCredit ? '+' : '-'}${data.amount}
      </div>
      <div style="margin-top: 8px; font-size: 14px; color: ${COLORS.muted};">
        New Balance: <strong>${data.newBalance}</strong>
      </div>
    </div>

    <table class="details-table">
      <tr>
        <td class="details-label">Description</td>
        <td class="details-value">${data.description || 'System Adjustment'}</td>
      </tr>
      <tr>
        <td class="details-label">Date</td>
        <td class="details-value">${data.date || new Date().toLocaleDateString()}</td>
      </tr>
      ${data.transactionId ? `
      <tr>
        <td class="details-label">Transaction ID</td>
        <td class="details-value">#${data.transactionId}</td>
      </tr>
      ` : ''}
    </table>

    <div style="text-align: center;">
      <a href="${BASE_URL}/wallet" class="btn">View Wallet Details</a>
    </div>
  `;

  return BaseLayout(content, `Your wallet has been updated: ${data.amount}`);
};

export const getGeneralTemplate = (data: GeneralData) => {
  const content = `
    <h1>${data.title}</h1>
    <div>
      ${data.body.replace(/\n/g, '<br/>')}
    </div>
  `;
  return BaseLayout(content, data.previewText || data.title);
};

export const getWelcomeTemplate = (data: WelcomeData) => {
  const content = `
      <h1 style="text-align: center; color: ${COLORS.secondary};">Welcome to Vehix, ${data.userName}!</h1>
      <p>We are thrilled to have you join our platform as a <strong>${data.role}</strong>.</p>
      <p>Your account has been successfully created. To get started, please follow these steps:</p>
      
      <div style="background-color: ${COLORS.background}; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: ${COLORS.primary};">How to Start:</h3>
        <ol style="padding-left: 20px; color: ${COLORS.text};">
          <li style="margin-bottom: 10px;">Download the <strong>Vehix App</strong> from the Google Play Store or Apple App Store.</li>
          <li style="margin-bottom: 10px;">Open the app and log in using your registered phone number.</li>
          <li style="margin-bottom: 10px;">Complete your profile and any required verifications.</li>
          <li>Tap "Go Online" to start accepting requests!</li>
        </ol>
      </div>

      <div class="info-box">
        <strong>Tip:</strong> Keep your app updated to ensure you have the latest features and performance improvements.
      </div>
    `;
  return BaseLayout(content, "Welcome to the Vehix Platform!");
};

export const getServiceCompletedTemplate = (data: ServiceCompletedData) => {
  const content = `
      <h1>Service Completed</h1>
      <p>Hi ${data.userName},</p>
      <p>The service request <strong>${data.serviceName}</strong> has been marked as completed.</p>
      
      <table class="details-table">
        <tr>
          <td class="details-label">Service ID</td>
          <td class="details-value">#${data.serviceId}</td>
        </tr>
         <tr>
          <td class="details-label">Completion Date</td>
          <td class="details-value">${data.completedDate}</td>
        </tr>
      </table>
  
      <p style="margin-top: 20px;">We hope you are satisfied with the service provided.</p>
      
      ${data.ratingUrl ? `
      <div style="text-align: center;">
        <a href="${data.ratingUrl}" class="btn">Rate Service</a>
      </div>
      ` : ''}
    `;
  return BaseLayout(content, `Service #${data.serviceId} Completed`);
};

export const getAccountApprovedTemplate = (data: AccountApprovedData) => {
  const content = `
      <div style="text-align: center; margin-bottom: 20px;">
        <span style="font-size: 48px;">🎉</span>
      </div>
      <h1 style="text-align: center;">You're Approved!</h1>
      <p>Hello ${data.userName},</p>
      <p>Great news! Your <strong>${data.role}</strong> account has been reviewed and approved by our administration team.</p>
      <p>You can now start accepting requests and using the full capabilities of the Vehix app.</p>
      
      <div style="text-align: center;">
        <a href="${data.loginUrl || `${BASE_URL}/login`}" class="btn">Go to Dashboard</a>
      </div>
    `;
  return BaseLayout(content, "Your Vehix account has been approved!");
};
export const getWelcomeApprovalTemplate = (data: WelcomeData) => {
  const content = `
    <h1 style="text-align: center; color: ${COLORS.secondary};">Welcome to Vehix, ${data.userName}!</h1>
    <p>We are thrilled to have you join our platform as a <strong>${data.role}</strong>.</p>
    <p>Your account has been <strong>approved</strong> and is now fully active.</p>
    
    <div style="background-color: ${COLORS.background}; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: ${COLORS.primary};">Get Started Now:</h3>
      <ol style="padding-left: 20px; color: ${COLORS.text};">
        <li style="margin-bottom: 10px;">Download the <strong>Vehix App</strong> on your mobile device.</li>
        <li style="margin-bottom: 10px;">Log in using your credentials.</li>
        <li style="margin-bottom: 10px;">Ensure your location services are enabled.</li>
        <li>Start your shift by going online!</li>
      </ol>
    </div>

    <div class="info-box">
      <strong>Note:</strong> Maintaining a high rating ensures priority access to new requests.
    </div>
  `;
  return BaseLayout(content, "Welcome! Your Vehix account is approved.");
};
