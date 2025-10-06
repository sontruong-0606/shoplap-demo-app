import { json } from "@remix-run/react";

export const action = async ({ request }) => {
    try {
        const shopDomain = request.headers.get('X-Shopify-Shop-Domain');
        const accessToken = request.headers.get('X-Shopify-Access-Token');
        const version = request.headers.get('version');

        if (!shopDomain || !accessToken) {
            return join(
                {
                    error: "Missing data for headers",
                },
                { status: 400 }
            );
        }

        const data = request.headers.join();
        console.log('Data', data);

        const createProductRes = await fetch(
            `https://${shopDomain}/admin/api/${version}/products.json`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Shopify-Access-Token": accessToken,
                },
                body: JSON.stringify({
                    product: {
                        title: data.title,
                        body_html: data.description,
                        vendor: data.vendor,
                        product_type: data.productType,
                        status: data.status || "active", // REST dùng lowercase
                    },
                }),
            }
        );

        const createProductData = await createProductRes.json();

        if (!createProductRes.ok || !createProductData.product) {
            return json(
                {
                    error: "Failed to create product",
                    details: createProductData.errors || createProductData
                },
                { status: 400 }
            )
        }

        const product = createProductData.product;
        const variant = product.variants[0];
        const variantId = variant.id;
        const inventoryItemId = variant.inventory_item_id;

        const updateVariantRes = await fetch(
            `https://${shopDomain}/admin/api/2025-07/variants/${variantId}.json`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "X-Shopify-Access-Token": accessToken,
                },
                body: JSON.stringify({
                    variant: {
                        id: variantId,
                        price: data.price || "0.00",
                        inventory_management: "shopify",
                    },
                }),
            }
        );

        const updateVariantData = await updateVariantRes.json();

        if (!updateVariantRes.ok) {
            return json(
                {
                    error: "Failed to update variant",
                    details: updateVariantData.errors || updateVariantData,
                },
                { status: 400 }
            );
        }

        // 3. Lấy danh sách locations
        const locationRes = await fetch(
            `https://${shopDomain}/admin/api/2025-07/locations.json`,
            {
                headers: {
                    "X-Shopify-Access-Token": accessToken,
                },
            }
        );

        const locationData = await locationRes.json();
        if (!locationRes.ok || !locationData.locations?.length) {
            return json(
                {
                    error: "Failed to fetch locations",
                    details: locationData.errors || locationData,
                },
                { status: 400 }
            );
        }

        const locationId = locationData.locations[0].id;

        // 4. Cập nhật tồn kho
        const quantity = parseInt(data.quantity || 0);

        const inventoryRes = await fetch(
            `https://${shopDomain}/admin/api/${version}/inventory_levels/set.json`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Shopify-Access-Token": accessToken,
                },
                body: JSON.stringify({
                    location_id: locationId,
                    inventory_item_id: inventoryItemId,
                    available: quantity,
                }),
            }
        );

        const inventoryData = await inventoryRes.json();

        if (!inventoryRes.ok) {
            return json(
                {
                    error: "Failed to update inventory",
                    details: inventoryData.errors || inventoryData,
                },
                { status: 400 }
            );
        }

        return json({
            success: true,
            product,
            variant: updateVariantData.variant,
            inventory: {
                location_id: locationId,
                inventory_item_id: inventoryItemId,
                available: quantity,
            },
        });
    } catch (error) {
        console.error('Error details:', error);
        return json({
            error: "Failed to process request",
            message: error.message
        }, { status: 500 });
    }
};

export const loader = async () => {
    return json({ message: "Created product!" })
}