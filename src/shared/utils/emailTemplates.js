// Email templates optimized for all major email clients (Gmail, Outlook, Apple Mail, etc.)
export const renderEmailTemplate = (templateId, variables) => {
    const templates = {
        'modern-gradient': modernGradientTemplate,
        'minimal-clean': minimalCleanTemplate,
        'corporate-professional': corporateProfessionalTemplate,
        'image-focused': imageFocusedTemplate,
        'social-modern': socialModernTemplate
    };
    const template = templates[templateId];
    if (!template) {
        throw new Error(`Template with ID "${templateId}" not found`);
    }
    return template(variables);
};
// Modern Gradient Template - Gmail/Outlook Compatible
const modernGradientTemplate = (vars) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <title>${vars.title}</title>
    <style>
        /* Reset styles */
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; }
        
        /* Client-specific styles */
        .ReadMsgBody { width: 100%; }
        .ExternalClass { width: 100%; }
        .ExternalClass * { line-height: 100%; }
        
        /* Outlook-specific */
        table { border-collapse: collapse !important; }
        .outlook-padding { padding: 0 !important; }
        
        @media screen and (max-width: 600px) {
            .container { width: 100% !important; }
            .mobile-padding { padding: 20px !important; }
            .mobile-text { font-size: 16px !important; line-height: 1.5 !important; }
            .mobile-title { font-size: 24px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: ${vars.fontFamily};">
    <!-- Preview text -->
    <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: ${vars.fontFamily}; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
        ${vars.content.substring(0, 100)}...
    </div>
    
    <!-- Main container -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: linear-gradient(135deg, ${vars.primaryColor} 0%, ${vars.secondaryColor} 100%);">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <!-- Email wrapper -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="container" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);">
                    ${vars.headerImage ? `
                    <!-- Header Image -->
                    <tr>
                        <td style="padding: 0;">
                            <img src="${vars.headerImage}" alt="Header" width="600" style="width: 100%; height: auto; display: block; border-radius: 12px 12px 0 0;">
                        </td>
                    </tr>
                    ` : ''}
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;" class="mobile-padding">
                            <!-- Title -->
                            <h1 style="margin: 0 0 20px 0; color: #333333; font-size: 28px; font-weight: 700; line-height: 1.3; font-family: ${vars.fontFamily};" class="mobile-title">
                                ${vars.title}
                            </h1>
                            
                            <!-- Content -->
                            <div style="margin: 0 0 30px 0; color: #666666; font-size: 16px; line-height: 1.6; font-family: ${vars.fontFamily};" class="mobile-text">
                                ${vars.content}
                            </div>
                            
                            ${vars.ctaText && vars.ctaUrl ? `
                            <!-- CTA Button -->
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="background-color: ${vars.primaryColor}; border-radius: 6px;">
                                        <a href="${vars.ctaUrl}" style="display: inline-block; padding: 12px 24px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; font-family: ${vars.fontFamily};">
                                            ${vars.ctaText}
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            ` : ''}
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 12px 12px;">
                            <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px; font-family: ${vars.fontFamily};">
                                You received this email because you subscribed to our newsletter.
                            </p>
                            <a href="${vars.unsubscribeUrl}" style="color: #999999; text-decoration: none; font-size: 14px; font-family: ${vars.fontFamily};">
                                Unsubscribe
                            </a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;
// Minimal Clean Template - Maximum compatibility
const minimalCleanTemplate = (vars) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>${vars.title}</title>
    <style>
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; }
        table { border-collapse: collapse !important; }
        
        @media screen and (max-width: 600px) {
            .container { width: 100% !important; }
            .mobile-padding { padding: 20px !important; }
            .mobile-text { font-size: 16px !important; }
            .mobile-title { font-size: 26px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${vars.backgroundColor}; font-family: ${vars.fontFamily};">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="container" style="max-width: 600px;">
                    ${vars.headerImage ? `
                    <tr>
                        <td style="padding: 0 0 20px 0;">
                            <img src="${vars.headerImage}" alt="Header" width="600" style="width: 100%; height: auto; display: block;">
                        </td>
                    </tr>
                    ` : ''}
                    
                    <tr>
                        <td style="padding: 20px 0;" class="mobile-padding">
                            <h1 style="margin: 0 0 30px 0; color: ${vars.primaryColor}; font-size: 32px; font-weight: 600; line-height: 1.2; font-family: ${vars.fontFamily};" class="mobile-title">
                                ${vars.title}
                            </h1>
                            
                            <div style="margin: 0 0 40px 0; color: ${vars.secondaryColor}; font-size: 18px; line-height: 1.7; font-family: ${vars.fontFamily};" class="mobile-text">
                                ${vars.content}
                            </div>
                            
                            ${vars.ctaText && vars.ctaUrl ? `
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="background-color: ${vars.primaryColor}; padding: 15px 30px;">
                                        <a href="${vars.ctaUrl}" style="color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; font-family: ${vars.fontFamily};">
                                            ${vars.ctaText}
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            ` : ''}
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="border-top: 1px solid #e5e5e5; padding: 20px 0; text-align: center;">
                            ${vars.companyName ? `
                            <p style="margin: 0 0 10px 0; color: #999999; font-size: 14px; font-family: ${vars.fontFamily};">
                                ${vars.companyName}${vars.companyAddress ? ` • ${vars.companyAddress}` : ''}
                            </p>
                            ` : ''}
                            <a href="${vars.unsubscribeUrl}" style="color: #999999; text-decoration: none; font-size: 14px; font-family: ${vars.fontFamily};">
                                Unsubscribe
                            </a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;
// Corporate Professional Template
const corporateProfessionalTemplate = (vars) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>${vars.title}</title>
    <style>
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; }
        table { border-collapse: collapse !important; }
        
        @media screen and (max-width: 600px) {
            .container { width: 100% !important; }
            .mobile-padding { padding: 20px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: ${vars.fontFamily};">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
            <td align="center" style="padding: 30px 20px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="650" class="container" style="max-width: 650px; background-color: #ffffff; border: 1px solid #dddddd;">
                    <!-- Header -->
                    <tr>
                        <td style="background-color: ${vars.primaryColor}; padding: 20px; text-align: center;">
                            ${vars.logoUrl ? `
                            <img src="${vars.logoUrl}" alt="Logo" style="height: 40px; width: auto;">
                            ` : ''}
                            <h2 style="color: #ffffff; margin: 10px 0 0 0; font-size: 24px; font-family: ${vars.fontFamily};">
                                ${vars.headerTitle || vars.companyName || 'Invoice'}
                            </h2>
                        </td>
                    </tr>
                    
                    ${vars.headerImage ? `
                    <tr>
                        <td style="padding: 0;">
                            <img src="${vars.headerImage}" alt="Header" width="650" style="width: 100%; height: auto; display: block;">
                        </td>
                    </tr>
                    ` : ''}
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 30px;" class="mobile-padding">
                            <h1 style="margin: 0 0 20px 0; color: ${vars.primaryColor}; font-size: 26px; font-weight: normal; font-family: ${vars.fontFamily};">
                                ${vars.title}
                            </h1>
                            
                            <div style="margin: 0 0 25px 0; color: #555555; font-size: 16px; line-height: 1.6; font-family: ${vars.fontFamily};">
                                ${vars.content}
                            </div>
                            
                            ${vars.ctaText && vars.ctaUrl ? `
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="background-color: ${vars.secondaryColor}; padding: 12px 24px; text-align: center;">
                                        <a href="${vars.ctaUrl}" style="color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; font-family: ${vars.fontFamily};">
                                            ${vars.ctaText}
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            ` : ''}
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f7f7f7; padding: 20px; text-align: center; border-top: 1px solid #dddddd;">
                            ${vars.llpin || vars.gstNumber || vars.cinNumber || vars.companyAddress ? `
                            <p style="margin: 0 0 6px 0; color: #333333; font-size: 12px; font-family: ${vars.fontFamily};">
                                ${vars.companyName || 'Your Company'}
                                ${vars.llpin ? ` • LLPIN: ${vars.llpin}` : ''}
                                ${vars.gstNumber ? ` • GSTIN: ${vars.gstNumber}` : ''}
                                ${vars.cinNumber ? ` • CIN: ${vars.cinNumber}` : ''}
                            </p>
                            <p style="margin: 0 0 10px 0; color: #333333; font-size: 12px; font-family: ${vars.fontFamily};">
                                ${vars.companyAddress || ''}
                            </p>
                            ` : ''}
                            <p style="margin: 0 0 5px 0; color: #333333; font-size: 13px; font-family: ${vars.fontFamily};">
                                © ${new Date().getFullYear()} ${vars.companyName || 'Your Company'}. All rights reserved.
                            </p>
                            <a href="${vars.unsubscribeUrl}" style="color: #333333; text-decoration: underline; font-size: 13px; font-family: ${vars.fontFamily};">
                                Unsubscribe
                            </a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;
// Image Focused Template
const imageFocusedTemplate = (vars) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>${vars.title}</title>
    <style>
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; }
        table { border-collapse: collapse !important; }
        
        @media screen and (max-width: 600px) {
            .container { width: 100% !important; }
            .mobile-padding { padding: 20px !important; }
            .mobile-overlay { margin: -50px 10px 0 10px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${vars.backgroundColor}; font-family: ${vars.fontFamily};">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
            <td align="center" style="padding: 20px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="container" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                    ${vars.backgroundImage ? `
                    <!-- Background Image -->
                    <tr>
                        <td style="position: relative; padding: 0;">
                            <img src="${vars.backgroundImage}" alt="Background" width="600" style="width: 100%; height: 300px; object-fit: cover; display: block;">
                        </td>
                    </tr>
                    ` : ''}
                    
                    <!-- Content Overlay -->
                    <tr>
                        <td style="position: relative; z-index: 2; background-color: rgba(255,255,255,0.95); margin: -100px 20px 0 20px; border-radius: 8px; padding: 30px;" class="mobile-overlay mobile-padding">
                            <h1 style="margin: 0 0 15px 0; color: #333333; font-size: 30px; font-weight: bold; text-align: center; font-family: ${vars.fontFamily};">
                                ${vars.title}
                            </h1>
                            
                            <div style="margin: 0 0 25px 0; color: #666666; font-size: 16px; line-height: 1.6; text-align: center; font-family: ${vars.fontFamily};">
                                ${vars.content}
                            </div>
                            
                            ${vars.ctaText && vars.ctaUrl ? `
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                                <tr>
                                    <td style="background-color: ${vars.primaryColor}; border-radius: 25px; padding: 12px 30px; text-align: center;">
                                        <a href="${vars.ctaUrl}" style="color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; font-family: ${vars.fontFamily};">
                                            ${vars.ctaText}
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            ` : ''}
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px; text-align: center; background-color: #f8f9fa;">
                            <p style="margin: 0; color: #666666; font-size: 12px; font-family: ${vars.fontFamily};">
                                <a href="${vars.unsubscribeUrl}" style="color: #666666; text-decoration: none;">Unsubscribe</a>
                                ${vars.preferencesUrl ? ` | <a href="${vars.preferencesUrl}" style="color: #666666; text-decoration: none;">Update Preferences</a>` : ''}
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;
// Social Modern Template - Modern social media inspired design
const socialModernTemplate = (vars) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>${vars.title}</title>
    <style>
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; }
        table { border-collapse: collapse !important; }
        
        @media screen and (max-width: 600px) {
            .container { width: 100% !important; }
            .mobile-padding { padding: 20px !important; }
            .mobile-text { font-size: 16px !important; }
            .mobile-title { font-size: 24px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(45deg, #667eea, #764ba2); padding: 30px 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: linear-gradient(45deg, #667eea, #764ba2);">
        <tr>
            <td align="center" style="padding: 30px 15px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="500" class="container" style="max-width: 500px; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.1);">
                    <!-- Content -->
                    <tr>
                        <td style="padding: 30px 25px; text-align: center;" class="mobile-padding">
                            <!-- Logo Circle -->
                            <div style="width: 80px; height: 80px; background: linear-gradient(45deg, #667eea, #764ba2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold;">
                                ${vars.logoUrl ? `<img src="${vars.logoUrl}" alt="Logo" style="width: 50px; height: 50px; border-radius: 50%;">` : vars.companyName ? vars.companyName.charAt(0) : '✉'}
                            </div>
                            
                            <!-- Title -->
                            <h1 style="color: #333; font-size: 28px; font-weight: 700; margin: 0 0 15px 0; font-family: ${vars.fontFamily};" class="mobile-title">
                                ${vars.title}
                            </h1>
                            
                            <!-- Content -->
                            <div style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 25px; font-family: ${vars.fontFamily};" class="mobile-text">
                                ${vars.content}
                            </div>
                            
                            ${vars.ctaText && vars.ctaUrl ? `
                            <!-- CTA Button -->
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                                <tr>
                                    <td style="background: linear-gradient(45deg, ${vars.primaryColor}, ${vars.secondaryColor}); border-radius: 25px; padding: 14px 28px;">
                                        <a href="${vars.ctaUrl}" style="color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; font-family: ${vars.fontFamily};">
                                            ${vars.ctaText}
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            ` : ''}
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background: #f8f9fb; padding: 15px; text-align: center; font-size: 12px; color: #999; font-family: ${vars.fontFamily};">
                            <a href="${vars.unsubscribeUrl}" style="color: #999; text-decoration: none;">
                                Unsubscribe
                            </a>
                            ${vars.preferencesUrl ? ` | <a href="${vars.preferencesUrl}" style="color: #999; text-decoration: none;">Preferences</a>` : ''}
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;
