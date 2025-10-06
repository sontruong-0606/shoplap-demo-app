import { json } from "@remix-run/node";
import prisma from "../db.server";
import { authenticate, apiVersion } from "../shopify.server";

export const action = async ({ request }) => {
    const systemSetting = await prisma.systemSettings.findUnique({
        where: { system_key: "NAILSOFT_SYSTEM" },
    });

    if (!systemSetting) {
        return json({ error: "System settings not found" }, { status: 500 });
    }

    const systemToken = systemSetting.access_token;

    const res = await fetch(`${systemSetting.system_domain}/api/Product?page=2&row=10`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "DeviceId": "2CD4C7D7-A9DE-4D14-956F-C8B143E77D2D",
            "Authorization": `Bearer ${systemToken}`
        }
    });

    const result = await res.json();

    console.log("Received data:", result);

    const products = result.data;

    const { admin, session } = await authenticate.admin(request);

    // // Lấy access token từ DB
    const shopDomain = session.shop;
    const accessToken = session.accessToken;
    const version = apiVersion || "2025-01";

    // console.log("ShopDomain:", shopDomain);
    // console.log("AccessToken:", accessToken);
    // console.log("SystemToken:", systemToken);
    // console.log("SystemDomain:", systemSetting.system_domain);

    // if (!shopDomain || !accessToken) {
    //     return json(
    //         { error: "Missing shop domain or access token in headers" },
    //         { status: 401 }
    //     );
    // }

    // const allProducts = result.data;

    // let hasNextPage = true;
    // let pageInfo = null;
    // const shopifyProducts = [];
    // const batchSize = 250; // REST API cho phép tối đa 250

    // while (hasNextPage) {
    //     let url = `${shopDomain}admin/api/${version}/products.json?limit=${batchSize}`;
    //     if (pageInfo) {
    //         url += `&page_info=${pageInfo}`;
    //     }

    //     const productsResponse = await fetch(url, {
    //         method: "GET",
    //         headers: {
    //             "X-Shopify-Access-Token": accessToken,
    //             "Content-Type": "application/json",
    //         },
    //     });

    //     if (!productsResponse.ok) {
    //         const errorBody = await productsResponse.text();
    //         throw new Error(`Failed to fetch products: ${errorBody}`);
    //     }

    //     const productsJson = await productsResponse.json();
    //     shopifyProducts.push(...productsJson.products);

    //     // Pagination: lấy page_info từ header `Link`

    //     const linkHeader = productsResponse.headers.get("link");
    //     if (linkHeader && linkHeader.includes('rel="next"')) {
    //         const match = linkHeader.match(/page_info=([^&>]+)/);
    //         pageInfo = match ? match[1] : null;
    //         hasNextPage = !!pageInfo;
    //     } else {
    //         hasNextPage = false;
    //     }
    // }

    // console.log("Received data:", shopifyProducts);

    // console.log(`Fetched ${shopifyProducts.length} products from Shopify`);

    // return json({ success: true, data: result.data });

    const createdProducts = [];

    for (const product of products) {
        try {
            const res = await fetch(
                `https://${shopDomain}/admin/api/${version}/products.json`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-Shopify-Access-Token": accessToken,
                    },
                    body: JSON.stringify({
                        product: {
                            title: product.name,
                            body_html: product.description,
                            product_type: product.categoryName,
                            status: "active",
                            variants: [
                                {
                                    sku: product.sku,
                                    barcode: product.barcode,
                                    price: product.price,
                                    inventory_quantity: product.quantity,
                                },
                            ],
                            images: [
                                {
                                    src: product.imageUrl,
                                },
                            ],
                        },
                    }),
                }
            );

            const shopifyProduct = await res.json();
            createdProducts.push(shopifyProduct);

        } catch (error) {
            console.error(`❌ Failed to sync product ${product.name}`, error);
        }
    }

    console.log(`✅ Successfully synced ${createdProducts.length} products to Shopify`);
    return json({ success: true, count: createdProducts.length, data: createdProducts });
};

export const loader = async () => {
    return json({ message: "Use POST to get access token" });
};
