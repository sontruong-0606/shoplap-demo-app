import { json } from "@remix-run/node";

export const action = async ({ request }) => {
    try {
        const data = await request.json();
        const { shop, client_id, client_secret } = data;

        if (!shop || !client_id || !client_secret) {
            return json({ error: "Missing required parameters" }, { status: 400 });
        }

        const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                client_id: client_id,
                client_secret: client_secret,
                grant_type: 'client_credentials'
            })
        });

        const tokenData = await tokenResponse.json();
        console.log('Token response:', tokenData);

        return json({
            success: true,
            access_token: tokenData.access_token
        });

    } catch (error) {
        console.error('Error getting token:', error);
        return json({ error: error.message }, { status: 500 });
    }
};

export const loader = async () => {
    return json({ message: "Use POST to get access token" });
};