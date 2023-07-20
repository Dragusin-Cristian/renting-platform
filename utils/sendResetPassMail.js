const nodemailer = require("nodemailer")
const { HOST } = require("../utils/constants")

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_ADDRESS,
    pass: process.env.EMAIL_PASSWORD
  }
});

const sendResetPassMail = async (email, uuid) => {
  const mailOptions = {
    from: "Sports booking platform",
    to: email,
    subject: "Password change",
    html: '<!DOCTYPE html>\
    <html>\
    <body style="font-family: Arial, sans-serif;">\
      <table style="max-width: 600px; margin: 0 auto; padding: 20px;">\
        <tr>\
          <td>\
            <h2>Password Change Notification</h2>\
            <p>Dear user,</p>\
            <p>Your link for changing your password is the following: '+ HOST + "/auth/reset-pass/" + uuid + ' </p>\
            <p>If you did not request this change, no further action is required.</p>\
            <br>\
            <p>Thank you,</p>\
            <p>The Sports booking platform Team</p>\
          </td>\
        </tr>\
      </table>\
    </body>\
    </html>\
'
  };

  await new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error sending email:', error);
        reject(error)
      } else {
        resolve(info)
      }
    });
  })
}

module.exports = sendResetPassMail
