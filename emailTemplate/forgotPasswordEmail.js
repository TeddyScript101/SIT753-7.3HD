const forgetPasswordEmail = (resetLink) => {
	const htmlContent = `
	  <!DOCTYPE html>
	  <html lang="en">
	  <head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>Password Reset</title>
	  </head>
	  <body style="margin: 0; padding: 0; background-color: #eabdb1; font-family: Arial, sans-serif;">
		<table width="100%" cellpadding="0" cellspacing="0" style="background-color: #eabdb1; padding: 40px 0;">
		  <tr>
			<td align="center">
			  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
				<tr>
				  <td>
					<h1 style="color: #170704; margin-top: 0;">Forgot Your Password?</h1>
					<p style="color: #170704; line-height: 1.6;">
					  It looks like you've requested a password reset for your account. No worries — just click the button below to reset it:
					</p>
					<p style="text-align: center;">
					  <a href="${resetLink}" target="_blank"
						style="display: inline-block; padding: 12px 24px; background-color: #dc5d3b; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
						Reset Password
					  </a>
					</p>
					<p style="color: #170704;">
					  If you didn’t request this, please ignore this email.
					</p>
					<div style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
					  &copy; ${new Date().getFullYear()} Your Company. All rights reserved.
					</div>
				  </td>
				</tr>
			  </table>
			</td>
		  </tr>
		</table>
	  </body>
	  </html>
	`;
	return htmlContent;
};

module.exports = forgetPasswordEmail;
