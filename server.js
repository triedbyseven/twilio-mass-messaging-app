require('dotenv').config();
const express = require('express');
const next = require('next');

const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const server = express();
    server.use(express.json());
    server.use(express.urlencoded());


    server.post('/api/twilio', async (request, response) => {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const subaccountSid = process.env.TWILIO_SUBACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const client = require('twilio')(accountSid, authToken, { accountSid: subaccountSid });

        const phoneNumbers = request.body.phoneNumbers;
        const messageBody = request.body.message;

        const errors = []

        for (let phoneNumber = 0; phoneNumber < phoneNumbers.length; phoneNumber++) {
            try {
                await client.messages.create({
                    from: process.env.TWILIO_PHONE_NUMBER,
                    to: phoneNumbers[phoneNumber].phoneNumberFormatted,
                    body: messageBody
                });
                errors.push({...phoneNumbers[phoneNumber], state: "success"});
            } catch (error) {
                errors.push({ ...phoneNumbers[phoneNumber], state: "failed"});
                console.error(error);
            }
        };

        response.set('Content-Type', 'application/json');
        response.send(JSON.stringify({ success: true, phoneNumbersFailed: errors }));
    });

    server.all('*', (request, response) => {
        return handle(request, response);
    });

    server.listen(port, (err) => {
        if (err) throw err
        console.log(`> Ready on http://localhost:${port}`)
    });
});