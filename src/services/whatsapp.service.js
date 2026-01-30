const axios = require('axios');

const sendWhatsAppMedia = async (partner, phone, caption, fileBuffer, fileName) => {
    // Check if partner has an active subscription (Method on Partner model)
    if (typeof partner.hasActiveSubscription === 'function' && !partner.hasActiveSubscription()) {
        console.log(`WhatsApp disabled for partner: ${partner.name} (No Active Subscription)`);
        return null;
    }

    const apiUrl = process.env.WHATSAPP_API_URL; // e.g., https://api.ultramsg.com/instance/messages/document
    const token = process.env.WHATSAPP_TOKEN;

    if (!apiUrl || !token) {
        console.error('WhatsApp API credentials missing in .env');
        return null;
    }

    try {
        // We'll use a multipart form data or base64 depending on the API
        // For UltraMsg, it's often a POST with document as URL or Base64
        const base64Content = fileBuffer.toString('base64');
        
        // Generic structure - adjust based on specific provider chosen later
        const response = await axios.post(apiUrl, {
            token: token,
            to: phone,
            filename: fileName,
            document: base64Content,
            caption: caption
        });

        return response.data;
    } catch (error) {
        console.error('WhatsApp sending failed:', error.message);
        return null;
    }
};

const sendWhatsAppText = async (partner, phone, message) => {
    if (typeof partner.hasActiveSubscription === 'function' && !partner.hasActiveSubscription()) return null;

    const apiUrl = process.env.WHATSAPP_TEXT_API_URL;
    const token = process.env.WHATSAPP_TOKEN;

    if (!apiUrl || !token) return null;

    try {
        const response = await axios.post(apiUrl, {
            token,
            to: phone,
            body: message
        });
        return response.data;
    } catch (error) {
        console.error('WhatsApp text failed:', error.message);
        return null;
    }
};

module.exports = {
    sendWhatsAppMedia,
    sendWhatsAppText
};
