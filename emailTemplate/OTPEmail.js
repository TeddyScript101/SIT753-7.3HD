const generateOtpHtml = (otp) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your OTP Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #eabdb1; font-family: Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #eabdb1; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="500" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 5px 15px rgba(0,0,0,0.05);">
          <tr>
            <td>
              <h1 style="color: #170704; text-align: center; margin-top: 0;">Your One-Time Password</h1>
              <p style="font-size: 16px; color: #170704; line-height: 1.5;">
                Use the following OTP to verify your email address. This code is valid for <strong>5 minutes</strong>.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <div style="display: inline-block; padding: 15px 30px; font-size: 24px; background: #dc5d3b; color: white; border-radius: 8px; letter-spacing: 3px;">
                  ${otp}
                </div>
              </div>
              <p style="font-size: 14px; color: #170704; line-height: 1.5;">
                If you did not request this, you can safely ignore this email.
              </p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="font-size: 12px; color: #888; text-align: center;">
                &copy; ${new Date().getFullYear()} Giftzy. All rights reserved.<br />
                Our mailing address is: support@yourdomain.com
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

module.exports = generateOtpHtml;
