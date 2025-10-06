import { json } from "@remix-run/node";

export const action = async ({ request }) => {
    try {
        const shopDomain = request.headers.get("X-Shopify-Shop-Domain");
        const accessToken = request.headers.get("X-Shopify-Access-Token");
        const version = request.headers.get('version');

        if (!shopDomain || !accessToken) {
            return json(
                { error: "Missing shop domain or access token in headers" },
                { status: 401 }
            );
        }

        console.log("Using shop:", shopDomain);
        console.log("Token exists:", !!accessToken);

        const data = await request.json();
        console.log("Received data:", data);

        const payload = {
            webhook: {
                topic: topic,
                address: address,
                format: "json",
            },
        };

        const response = await fetch(
            `https://${shopDomain}/admin/api/${version}/webhooks.json`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Shopify-Access-Token": accessToken,
                },
                body: JSON.stringify(payload),
            }
        );

        const responseText = await response.text();
        console.log("Response status:", response.status);
        console.log("Response text:", responseText);

        try {
            const responseJson = JSON.parse(responseText);

            if (!response.ok) {
                return json({ error: responseJson.errors || "Shopify error" }, { status: response.status });
            }

            return json({ success: true, webhook: responseJson.webhook });
        } catch (parseError) {
            console.error("Error parsing response:", parseError);
            return json({ error: "Invalid response from Shopify" }, { status: 500 });
        }
    } catch (error) {
        console.error("Error details:", error);
        return json(
            {
                error: "Failed to create webhook",
                message: error.message,
                stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
            },
            { status: 500 }
        );
    }
};

export const loader = async () => {
    return json({ message: "Use POST to create webhooks" });
};
