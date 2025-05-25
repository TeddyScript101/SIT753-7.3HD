const secretAngelInviteEmail = (inviteLink) => {
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Secret Angel Invitation</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f6f0e8; font-family: Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 0; background-color: #f6f0e8;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
                <tr>
                  <td>
                    <h1 style="color: #3b2f2f; margin-top: 0;">You're Invited to Join Secret Angel!</h1>
                    <p style="color: #3b2f2f; line-height: 1.6;">
                      🎁 Someone just invited you to play the **Secret Angel** gift exchange game! It's a fun and thoughtful way to surprise and delight your friends or team.
                    </p>
                    <p style="color: #3b2f2f; line-height: 1.6;">
                      Tap the button below to join the game and become someone's Secret Angel!
                    </p>
                    <p style="text-align: center;">
                      <a href="${inviteLink}" target="_blank"
                        style="display: inline-block; padding: 12px 24px; background-color: #c94c4c; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
                        Accept Invitation
                      </a>
                    </p>
                    <p style="color: #3b2f2f; line-height: 1.6;">
                      Don’t miss out on the fun! If you have any questions, reach out to the person who invited you.
                    </p>
                    <div style="margin-top: 30px; font-size: 12px; color: #999; text-align: center;">
                      &copy; ${new Date().getFullYear()} Secret Angel. All rights reserved.
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

module.exports = secretAngelInviteEmail;
