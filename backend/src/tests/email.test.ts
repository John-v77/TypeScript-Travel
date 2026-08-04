import Email from '../utils/email/email';
import { User } from '../models/userModel';
import nodemailer from 'nodemailer';
import pug from 'pug';
import * as htmlToText from 'html-to-text';

jest.mock('nodemailer');
jest.mock('pug', () => ({
  renderFile: jest.fn(),
}));
jest.mock('html-to-text', () => ({
  convert: jest.fn(),
}));

const mockNodemailer = nodemailer as jest.Mocked<typeof nodemailer>;
const mockPug = pug;
const mockConvert = htmlToText.convert as jest.MockedFunction<typeof htmlToText.convert>;

describe('Email Class', () => {
  const mockUser = {
    name: 'John Doe',
    email: 'john@example.com',
  } as User;

  const testUrl = 'http://example.com/reset-password/token123';
  let mockTransporter: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
    };

    mockNodemailer.createTransport.mockReturnValue(mockTransporter);
    (mockPug.renderFile as jest.Mock).mockReturnValue('<html><body>Test Email</body></html>');
    mockConvert.mockReturnValue('Test Email');

    process.env.EMAIL_FROM = 'test@natours.com';
    process.env.EMAIL_HOST = 'smtp.mailtrap.io';
    process.env.EMAIL_PORT2 = '2525';
    process.env.EMAIL_USERNAME = 'testuser';
    process.env.EMAIL_PASSWORD = 'testpass';
  });

  describe('Constructor', () => {
    it('should initialize email properties correctly', () => {
      const email = new Email(mockUser, testUrl);

      expect(email.to).toBe('john@example.com');
      expect(email.firstName).toBe('John');
      expect(email.url).toBe(testUrl);
      expect(email.from).toBe('Natours <test@natours.com>');
    });

    it('should extract first name from full name', () => {
      const userWithLongName = {
        name: 'Mary Jane Watson',
        email: 'mary@example.com',
      } as User;

      const email = new Email(userWithLongName, testUrl);
      expect(email.firstName).toBe('Mary');
    });

    it('should handle single name correctly', () => {
      const userWithSingleName = {
        name: 'Madonna',
        email: 'madonna@example.com',
      } as User;

      const email = new Email(userWithSingleName, testUrl);
      expect(email.firstName).toBe('Madonna');
    });
  });

  describe('newTransport', () => {
    it('should create development transport when NODE_ENV is not production', () => {
      process.env.NODE_ENV = 'development';

      const email = new Email(mockUser, testUrl);
      const transport = email.newTransport();

      expect(mockNodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.mailtrap.io',
        port: 2525,
        auth: {
          user: 'testuser',
          pass: 'testpass',
        },
      });
      expect(transport).toBe(mockTransporter);
    });

    it('should create production transport when NODE_ENV is production', () => {
      process.env.NODE_ENV = 'production';
      process.env.SENDGRID_USERNAME = 'sendgrid-user';
      process.env.SENDGRID_PASSWORD = 'sendgrid-pass';

      const email = new Email(mockUser, testUrl);
      const transport = email.newTransport();

      expect(mockNodemailer.createTransport).toHaveBeenCalledWith({
        service: 'SendGrid',
        auth: {
          user: 'sendgrid-user',
          pass: 'sendgrid-pass',
        },
      });
      expect(transport).toBe(mockTransporter);
    });

    it('should use default port 587 if EMAIL_PORT2 is not set', () => {
      delete process.env.EMAIL_PORT2;
      process.env.NODE_ENV = 'development';

      const email = new Email(mockUser, testUrl);
      email.newTransport();

      expect(mockNodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.mailtrap.io',
        port: 587,
        auth: {
          user: 'testuser',
          pass: 'testpass',
        },
      });
    });
  });

  describe('send', () => {
    it('should render pug template and send email successfully', async () => {
      const email = new Email(mockUser, testUrl);
      const template = 'welcome';
      const subject = 'Welcome to Natours!';

      await email.send(template, subject);

      expect(mockPug.renderFile).toHaveBeenCalledWith(
        expect.stringContaining('/views/email/welcome.pug'),
        {
          firstName: 'John',
          url: testUrl,
          subject: subject,
        }
      );

      expect(mockConvert).toHaveBeenCalledWith(
        '<html><body>Test Email</body></html>'
      );

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'Natours <test@natours.com>',
        to: 'john@example.com',
        subject: subject,
        html: '<html><body>Test Email</body></html>',
        text: 'Test Email',
      });
    });

    it('should pass correct template path to pug.renderFile', async () => {
      const email = new Email(mockUser, testUrl);
      await email.send('passwordReset', 'Reset your password');

      expect(mockPug.renderFile).toHaveBeenCalledWith(
        expect.stringContaining('/views/email/passwordReset.pug'),
        expect.any(Object)
      );
    });

    it('should handle email sending errors', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP error'));

      const email = new Email(mockUser, testUrl);

      await expect(email.send('welcome', 'Welcome!')).rejects.toThrow(
        'SMTP error'
      );
    });

    it('should handle pug rendering errors', async () => {
      (mockPug.renderFile as jest.Mock).mockImplementation(() => {
        throw new Error('Template not found');
      });

      const email = new Email(mockUser, testUrl);

      await expect(email.send('welcome', 'Welcome!')).rejects.toThrow(
        'Template not found'
      );
    });
  });

  describe('sendWelcome', () => {
    it('should send welcome email with correct template and subject', async () => {
      const email = new Email(mockUser, testUrl);
      const sendSpy = jest.spyOn(email, 'send');

      await email.sendWelcome();

      expect(sendSpy).toHaveBeenCalledWith(
        'welcome',
        'Welcome to the Natours Family!'
      );
    });

    it('should call send method which renders and sends email', async () => {
      const email = new Email(mockUser, testUrl);

      await email.sendWelcome();

      expect(mockPug.renderFile).toHaveBeenCalledWith(
        expect.stringContaining('/views/email/welcome.pug'),
        expect.objectContaining({
          firstName: 'John',
          url: testUrl,
          subject: 'Welcome to the Natours Family!',
        })
      );

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'john@example.com',
          subject: 'Welcome to the Natours Family!',
        })
      );
    });
  });

  describe('sendPasswordReset', () => {
    it('should send password reset email with correct template and subject', async () => {
      const email = new Email(mockUser, testUrl);
      const sendSpy = jest.spyOn(email, 'send');

      await email.sendPasswordReset();

      expect(sendSpy).toHaveBeenCalledWith(
        'passwordReset',
        'Your password reset token (valid for only 10 minutes)'
      );
    });

    it('should call send method which renders and sends email', async () => {
      const email = new Email(mockUser, testUrl);

      await email.sendPasswordReset();

      expect(mockPug.renderFile).toHaveBeenCalledWith(
        expect.stringContaining('/views/email/passwordReset.pug'),
        expect.objectContaining({
          firstName: 'John',
          url: testUrl,
          subject: 'Your password reset token (valid for only 10 minutes)',
        })
      );

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'john@example.com',
          subject: 'Your password reset token (valid for only 10 minutes)',
        })
      );
    });
  });

  describe('Integration scenarios', () => {
    it('should support chaining multiple email sends', async () => {
      const email = new Email(mockUser, testUrl);

      await email.sendWelcome();
      await email.sendPasswordReset();

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(2);
    });

    it('should create separate transports for different instances', () => {
      const user1 = { name: 'User One', email: 'user1@example.com' } as User;
      const user2 = { name: 'User Two', email: 'user2@example.com' } as User;

      const email1 = new Email(user1, testUrl);
      const email2 = new Email(user2, testUrl);

      email1.newTransport();
      email2.newTransport();

      expect(mockNodemailer.createTransport).toHaveBeenCalledTimes(2);
    });

    it('should handle different environments for different email instances', async () => {
      process.env.NODE_ENV = 'development';
      const devEmail = new Email(mockUser, testUrl);
      await devEmail.sendWelcome();

      expect(mockNodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          host: 'smtp.mailtrap.io',
        })
      );

      process.env.NODE_ENV = 'production';
      process.env.SENDGRID_USERNAME = 'sendgrid-user';
      process.env.SENDGRID_PASSWORD = 'sendgrid-pass';
      const prodEmail = new Email(mockUser, testUrl);
      await prodEmail.sendWelcome();

      expect(mockNodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'SendGrid',
        })
      );
    });
  });
});
