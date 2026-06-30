const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function sendLoginCode(toEmail, code) {
    const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER;

    await transporter.sendMail({
        from: `"TFC Chatbot" <${fromAddress}>`,
        to: toEmail,
        subject: "Your TFC login code",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
                <h2>TFC Login Verification</h2>
                <p>Enter this code to finish logging in. It expires in 10 minutes.</p>
                <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; background: #f0f0f0; color: #000; padding: 16px; border-radius: 8px;">
                    ${code}
                </p>
                <p>If you didn't try to log in, you can ignore this email.</p>
            </div>
        `
    });
}

module.exports = { sendLoginCode };