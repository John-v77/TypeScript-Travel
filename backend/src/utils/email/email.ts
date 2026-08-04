import nodemailer from "nodemailer";
import pug from "pug";
import { convert } from "html-to-text";
import { User } from "../../models/userModel";

export default class Email {
  to: string;
  firstName: string;
  url: string;
  from: string;

  constructor(user: User, url: string) {
    this.to = user.email;
    this.firstName = user.name.split(" ")[0];
    this.url = url;
    this.from = `Natours <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === "production") {
      return nodemailer.createTransport({
        service: "SendGrid",
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT2 || "587"),
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(template: string, subject: string) {
    const html = pug.renderFile(`${__dirname}/../email/${template}`, {
      firstName: this.firstName,
      url: this.url,
      subject: subject,
    });

    const mailOptions = {
      from: this.from,
      to: this.to,
      subject: subject,
      html: html,
      text: convert(html),
    };

    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send("welcome-email.pug", "Welcome to the Natours Family!");
  }

  async sendPasswordReset() {
    await this.send(
      "password-reset.pug",
      "Your password reset token (valid for only 10 minutes)"
    );
  }
}
