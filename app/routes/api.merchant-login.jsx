import { json } from "@remix-run/node";

import prisma from "../db.server";

export const action = async ({ request }) => {
    try {
        const data = await request.json();
        const { email, password, deviceId } = data;

        console.log(data);

        if (!email || !password || !deviceId) {
            return json({ error: "Missing required parameters" }, { status: 400 });
        }

        const systemSetting = await prisma.systemSettings.findUnique({
            where: { system_key: "NAILSOFT_SYSTEM" }
        });

        console.log(systemSetting);

        if (!systemSetting) {
            return json({ error: "System settings not found" }, { status: 500 });
        }
        
        const res = await fetch(`${systemSetting.system_domain}/api/Merchant/Login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'DeviceId': '2CD4C7D7-A9DE-4D14-956F-C8B143E77D2D',
                'User-Agent': 'PostmanRuntime/7.45.0',
                'Postman-Token': 'a8d9faf6-57da-4dac-8327-f4910c5c7892'
            },
            body: JSON.stringify({
                email: email,
                password: password,
                deviceId: deviceId,
                isSignin: "1"
            })
        });

        const result = await res.json();
        console.log('Token response:', result);

        
        return json({
            success: true,
            access_token: result.data.token
        });

    } catch (error) {
        console.error('Error getting token:', error);
        return json({ error: error.message }, { status: 500 });
    }
};

export const loader = async () => {
    return json({ message: "Use POST to get access token" });
};