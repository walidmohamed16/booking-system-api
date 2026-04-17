const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Send Email Function
const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html
    });
    console.log(`✅ Email sent to ${to}`);
  } catch (error) {
    console.error(`❌ Email failed: ${error.message}`);
  }
};


// ===== Booking Emails =====

// 1. New Booking - Email to Provider
exports.sendNewBookingToProvider = async (booking) => {
  const subject = '📅 New Booking Received!';
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
      <h2 style="color: #2c3e50;">📅 New Booking Received!</h2>
      <div style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
        <p><strong>👤 Client:</strong> ${booking.client.name}</p>
        <p><strong>📧 Email:</strong> ${booking.client.email}</p>
        <p><strong>📱 Phone:</strong> ${booking.client.phone || 'N/A'}</p>
        <p><strong>🛎️ Service:</strong> ${booking.service.name}</p>
        <p><strong>📆 Date:</strong> ${new Date(booking.date).toLocaleDateString()}</p>
        <p><strong>🕐 Time:</strong> ${booking.startTime} - ${booking.endTime}</p>
        <p><strong>📝 Notes:</strong> ${booking.notes || 'No notes'}</p>
      </div>
      <p style="margin-top: 20px; color: #e74c3c;">
        ⚠️ Please confirm or reject this booking.
      </p>
    </div>
  `;
  await sendEmail(booking.provider.email, subject, html);
};

// 2. New Booking - Email to Client
exports.sendNewBookingToClient = async (booking) => {
  const subject = '✅ Booking Submitted Successfully!';
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
      <h2 style="color: #2c3e50;">✅ Booking Submitted!</h2>
      <div style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
        <p><strong>👨‍⚕️ Provider:</strong> ${booking.provider.name}</p>
        <p><strong>🛎️ Service:</strong> ${booking.service.name}</p>
        <p><strong>📆 Date:</strong> ${new Date(booking.date).toLocaleDateString()}</p>
        <p><strong>🕐 Time:</strong> ${booking.startTime} - ${booking.endTime}</p>
        <p><strong>💰 Price:</strong> ${booking.service.price} ${booking.service.currency || 'EGP'}</p>
        <p><strong>📊 Status:</strong> Pending</p>
      </div>
      <p style="margin-top: 20px; color: #f39c12;">
        ⏳ Waiting for provider confirmation.
      </p>
    </div>
  `;
  await sendEmail(booking.client.email, subject, html);
};

// 3. Booking Confirmed - Email to Client
exports.sendBookingConfirmed = async (booking) => {
  const subject = '🎉 Booking Confirmed!';
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
      <h2 style="color: #27ae60;">🎉 Your Booking is Confirmed!</h2>
      <div style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
        <p><strong>👨‍⚕️ Provider:</strong> ${booking.provider.name}</p>
        <p><strong>🛎️ Service:</strong> ${booking.service.name}</p>
        <p><strong>📆 Date:</strong> ${new Date(booking.date).toLocaleDateString()}</p>
        <p><strong>🕐 Time:</strong> ${booking.startTime} - ${booking.endTime}</p>
        <p><strong>💰 Price:</strong> ${booking.service.price} ${booking.service.currency || 'EGP'}</p>
      </div>
      <p style="margin-top: 20px; color: #27ae60;">
        ✅ See you there!
      </p>
    </div>
  `;
  await sendEmail(booking.client.email, subject, html);
};

// 4. Booking Cancelled - Email to both
exports.sendBookingCancelled = async (booking, cancelledByName) => {
  const subject = '❌ Booking Cancelled';
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
      <h2 style="color: #e74c3c;">❌ Booking Cancelled</h2>
      <div style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
        <p><strong>🛎️ Service:</strong> ${booking.service.name}</p>
        <p><strong>📆 Date:</strong> ${new Date(booking.date).toLocaleDateString()}</p>
        <p><strong>🕐 Time:</strong> ${booking.startTime} - ${booking.endTime}</p>
        <p><strong>🚫 Cancelled by:</strong> ${cancelledByName}</p>
        <p><strong>📝 Reason:</strong> ${booking.cancellationReason || 'No reason provided'}</p>
      </div>
    </div>
  `;

  // Send to both client and provider
  await sendEmail(booking.client.email, subject, html);
  await sendEmail(booking.provider.email, subject, html);
};

// 5. Booking Rescheduled - Email to both
exports.sendBookingRescheduled = async (booking, rescheduledByName) => {
  const subject = '📅 Booking Rescheduled';
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
      <h2 style="color: #f39c12;">📅 Booking Rescheduled</h2>
      <div style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
        <p><strong>🛎️ Service:</strong> ${booking.service.name}</p>
        <p><strong>📆 New Date:</strong> ${new Date(booking.date).toLocaleDateString()}</p>
        <p><strong>🕐 New Time:</strong> ${booking.startTime} - ${booking.endTime}</p>
        <p><strong>🔄 Rescheduled by:</strong> ${rescheduledByName}</p>
      </div>
      <p style="margin-top: 20px; color: #f39c12;">
        ⚠️ Please confirm the new schedule.
      </p>
    </div>
  `;

  await sendEmail(booking.client.email, subject, html);
  await sendEmail(booking.provider.email, subject, html);
};

// 6. Booking Completed - Email to Client
exports.sendBookingCompleted = async (booking) => {
  const subject = '✅ Booking Completed - Leave a Review!';
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
      <h2 style="color: #27ae60;">✅ Booking Completed!</h2>
      <div style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
        <p><strong>👨‍⚕️ Provider:</strong> ${booking.provider.name}</p>
        <p><strong>🛎️ Service:</strong> ${booking.service.name}</p>
        <p><strong>📆 Date:</strong> ${new Date(booking.date).toLocaleDateString()}</p>
        <p><strong>🕐 Time:</strong> ${booking.startTime} - ${booking.endTime}</p>
      </div>
      <p style="margin-top: 20px;">
        ⭐ We'd love to hear your feedback! Please leave a review.
      </p>
    </div>
  `;
  await sendEmail(booking.client.email, subject, html);
};