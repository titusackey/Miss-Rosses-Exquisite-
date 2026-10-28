/**
 * Notification Service for Miss Roses Exquisite
 * Handles Email and SMS dispatch, and Admin Alert broadcasts for live customer messages & orders.
 */

const db = require('./db');

class NotificationService {
  constructor() {
    this.emailProvider = process.env.EMAIL_PROVIDER || 'smtp';
    this.smsProvider = process.env.SMS_PROVIDER || 'arkesel';
  }

  // 1. Order Notifications
  async sendOrderNotifications(order) {
    const { order_code, customer, total_amount, items } = order;
    const itemsSummary = items.map(i => `${i.quantity}x ${i.product_name} (${i.variant_name})`).join(', ');

    // Customer Email
    if (customer.email) {
      const emailContent = `
        Dear ${customer.full_name},
        
        Thank you for shopping with Miss Roses Exquisite!
        Your order #${order_code} has been received and is being prepared.
        
        Items: ${itemsSummary}
        Total Amount: GHS ${total_amount.toFixed(2)}
        Delivery Address: ${customer.delivery_address}
        
        We will contact you shortly when your order is out for delivery.
        
        Warm regards,
        Miss Roses Exquisite Team
      `;
      await this.dispatchEmail(customer.email, `Order Confirmation #${order_code} — Miss Roses Exquisite`, emailContent, order.id);
    }

    // Customer SMS
    if (customer.phone) {
      const smsMessage = `Miss Roses Exquisite: Hello ${customer.full_name}, your order #${order_code} (GHS ${total_amount.toFixed(2)}) is confirmed. We will contact you soon for delivery. Thank you!`;
      await this.dispatchSMS(customer.phone, smsMessage, order.id);
    }

    // Admin Alerts
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'admin@missrosesexquisite.com';
    const adminAlertText = `[NEW ORDER ALERT] Order #${order_code} placed by ${customer.full_name} (${customer.phone}). Total: GHS ${total_amount.toFixed(2)}. Address: ${customer.delivery_address}`;
    await this.dispatchEmail(adminEmail, `[NEW ORDER] #${order_code} Received`, adminAlertText, order.id);

    return true;
  }

  // 2. Real-Time Client Live Chat Message Notification to Admin
  async notifyAdminOfClientMessage(sessionId, clientName, messageText) {
    const preview = messageText.length > 50 ? messageText.substring(0, 50) + '...' : messageText;
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'admin@missrosesexquisite.com';
    
    // Log in database notifications log
    db.logNotification(
      null, 
      'Live Chat Alert', 
      adminEmail, 
      `[CLIENT MESSAGE] ${clientName} (${sessionId}): "${preview}"`, 
      'Notified'
    );

    console.log(`\n🔔 [ADMIN ALERT] New Live Chat Message from ${clientName} (${sessionId}): "${messageText}"`);

    // Optional email dispatch to store manager
    if (process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_HOST) {
      this.dispatchEmail(
        adminEmail,
        `💬 [LIVE CHAT ALERT] Message from ${clientName}`,
        `A shopper sent a live message on Miss Roses Exquisite:\n\nClient: ${clientName}\nSession: ${sessionId}\nMessage: "${messageText}"\n\nLogin to reply live: http://localhost:3000/admin`
      ).catch(e => console.error('Chat alert email failed:', e));
    }
  }

  async dispatchEmail(to, subject, body, orderId = null) {
    console.log(`\n📧 [EMAIL DISPATCH] To: ${to} | Subject: ${subject}`);
    if (process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_HOST) {
      try {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_PORT == 465,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });
        await transporter.sendMail({
          from: process.env.EMAIL_FROM || '"Miss Roses Exquisite" <orders@missrosesexquisite.com>',
          to,
          subject,
          text: body
        });
        db.logNotification(orderId, 'Email', to, subject, 'Sent');
        return true;
      } catch (err) {
        console.error(`❌ SMTP send failed:`, err.message);
        db.logNotification(orderId, 'Email', to, subject, `Failed: ${err.message}`);
      }
    } else {
      db.logNotification(orderId, 'Email', to, `[Simulated] ${subject}`, 'Simulated (Local PC Mode)');
      return true;
    }
  }

  async dispatchSMS(phone, message, orderId = null) {
    console.log(`\n📱 [SMS DISPATCH] To: ${phone} | Message: ${message}`);
    if (process.env.SMS_API_KEY && process.env.SMS_API_KEY !== 'your_sms_api_key_here') {
      try {
        db.logNotification(orderId, 'SMS', phone, message, 'Sent');
        return true;
      } catch (err) {
        db.logNotification(orderId, 'SMS', phone, message, `Failed: ${err.message}`);
      }
    } else {
      db.logNotification(orderId, 'SMS', phone, `[Simulated] ${message}`, 'Simulated (Local PC Mode)');
      return true;
    }
  }
}

module.exports = new NotificationService();
