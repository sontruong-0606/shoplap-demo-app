import { json } from "@remix-run/node";

export const action = async ({ request }) => {
    try {
        // Lấy thông tin từ headers
        const shopDomain = request.headers.get('X-Shopify-Shop-Domain');
        const accessToken = request.headers.get('X-Shopify-Access-Token');
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

        // Validate required fields
        if (!data.productId) {
            return json({ error: "Product ID is required" }, { status: 400 });
        }

        const productId = data.productId;

        // --- Cập nhật thông tin sản phẩm qua REST API ---
        const updateProductResponse = await fetch(
            `https://${shopDomain}/admin/api/${version}}/products/${productId}.json`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "X-Shopify-Access-Token": accessToken,
                },
                body: JSON.stringify({
                    product: {
                        id: productId,
                        title: data.title,
                        body_html: data.description,
                        vendor: data.vendor,
                        product_type: data.productType,
                        status: data.status,
                    },
                }),
            }
        );

        const updatedProduct = await updateProductResponse.json();

        if (!updateProductResponse.ok) {
            console.error("Error updating product:", updatedProduct);
            return json(
                { error: "Failed to update product", details: updatedProduct },
                { status: updateProductResponse.status }
            );
        }

        // --- Nếu có media thì gọi API để thêm ---
        let mediaResults = [];
        if (Array.isArray(data.media) && data.media.length > 0) {
            for (const mediaItem of data.media) {
                const mediaResponse = await fetch(
                    `https://${shopDomain}/admin/api/${version}/products/${productId}/images.json`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "X-Shopify-Access-Token": accessToken,
                        },
                        body: JSON.stringify({
                            image: {
                                src: mediaItem.src,
                                alt: mediaItem.alt || "",
                            },
                        }),
                    }
                );

                const mediaJson = await mediaResponse.json();

                if (!mediaResponse.ok) {
                    console.error("Error adding media:", mediaJson);
                    mediaResults.push({
                        success: false,
                        error: mediaJson,
                    });
                } else {
                    mediaResults.push({
                        success: true,
                        image: mediaJson.image,
                    });
                }
            }
        }

        return json({
            success: true,
            product: updatedProduct.product,
            mediaResults,
        });
    } catch (error) {
        console.error("Error details:", error);
        return json(
            {
                error: "Failed to update product",
                message: error.message,
                stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
            },
            { status: 500 }
        );
    }
};

export const loader = async () => {
    return json({ message: "Use POST to update products" });
};
