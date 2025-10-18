const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = null;
        this.setupTransporter();
    }

    setupTransporter() {
        // Use SendGrid SMTP
        if (process.env.SENDGRID_API_KEY) {
            this.transporter = nodemailer.createTransport({
                host: 'smtp.sendgrid.net',
                port: 587,
                secure: false,
                auth: {
                    user: 'apikey',
                    pass: process.env.SENDGRID_API_KEY
                }
            });
            console.log('✅ Email service configured with SendGrid');
        }
        // Fallback to Gmail (if configured)
        else if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
            this.transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASSWORD
                }
            });
            console.log('✅ Email service configured with Gmail');
        }
        else {
            console.warn('⚠️  Email service not configured - emails will not be sent');
        }
    }

    async sendPasswordResetEmail(email, resetToken) {
        if (!this.transporter) {
            console.log('📧 Email not sent (no transporter configured)');
            return false;
        }

        try {
            const resetUrl = `https://vib3-backend-u8zjk.ondigitalocean.app/reset-password?token=${resetToken}`;

            const mailOptions = {
                from: process.env.EMAIL_FROM || 'noreply@vib3.app',
                to: email,
                subject: 'VIB3 - Password Reset Request',
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                            .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                            .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>🔐 Password Reset Request</h1>
                            </div>
                            <div class="content">
                                <p>Hi there,</p>
                                <p>We received a request to reset your VIB3 password. Click the button below to create a new password:</p>
                                <div style="text-align: center;">
                                    <a href="${resetUrl}" class="button">Reset Password</a>
                                </div>
                                <p>Or copy and paste this link into your browser:</p>
                                <p style="background: #fff; padding: 10px; border: 1px solid #ddd; border-radius: 5px; word-break: break-all;">
                                    ${resetUrl}
                                </p>
                                <p><strong>This link will expire in 1 hour.</strong></p>
                                <p>If you didn't request a password reset, you can safely ignore this email.</p>
                            </div>
                            <div class="footer">
                                <p>VIB3 - Your Ultimate Social Experience</p>
                                <p>This is an automated email. Please do not reply.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `,
                text: `
                    Password Reset Request

                    We received a request to reset your VIB3 password.

                    Click this link to reset your password:
                    ${resetUrl}

                    This link will expire in 1 hour.

                    If you didn't request a password reset, you can safely ignore this email.

                    VIB3 - Your Ultimate Social Experience
                `
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('✅ Password reset email sent:', info.messageId);
            return true;
        } catch (error) {
            console.error('❌ Error sending email:', error);
            return false;
        }
    }

    async sendWelcomeEmail(email, username) {
        if (!this.transporter) {
            console.log('📧 Welcome email not sent (no transporter configured)');
            return false;
        }

        try {
            const mailOptions = {
                from: process.env.EMAIL_FROM || 'noreply@vib3.app',
                to: email,
                subject: 'Welcome to VIB3! 🎉',
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                            .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>🎉 Welcome to VIB3!</h1>
                            </div>
                            <div class="content">
                                <p>Hi ${username},</p>
                                <p>Welcome to VIB3 - Your ultimate social experience!</p>
                                <p>You're now part of a vibrant community where you can:</p>
                                <ul>
                                    <li>📹 Share amazing videos</li>
                                    <li>❤️ Connect with friends</li>
                                    <li>🎨 Express your creativity</li>
                                    <li>🌟 Discover trending content</li>
                                </ul>
                                <p>Get started by:</p>
                                <ol>
                                    <li>Complete your profile</li>
                                    <li>Upload your first video</li>
                                    <li>Follow interesting creators</li>
                                </ol>
                                <p>Have fun and start vibing!</p>
                            </div>
                            <div class="footer">
                                <p>VIB3 - Your Ultimate Social Experience</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('✅ Welcome email sent:', info.messageId);
            return true;
        } catch (error) {
            console.error('❌ Error sending welcome email:', error);
            return false;
        }
    }
}

// Export singleton instance
module.exports = new EmailService();
