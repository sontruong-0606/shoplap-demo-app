import {
  Box,
  Card,
  Layout,
  Link,
  List,
  Page,
  Text,
  BlockStack,
  InlineGrid,
  Divider,
  TextField,
  useBreakpoints,
  Button
} from "@shopify/polaris";
import { json } from "@remix-run/node";
import { TitleBar } from "@shopify/app-bridge-react";
import { useState } from "react";
import { useActionData, useLoaderData, Form } from "@remix-run/react";
import { Banner } from "@shopify/polaris";
import { authenticate, apiVersion } from "../shopify.server";

export async function loader() {
  return json({ message: "Success" });
}

export async function action({ request }) {
  // updates persistent data
  const { admin, session } = await authenticate.admin(request);

  const shopDomain = session.shop;
  const accessToken = session.accessToken;
  const version = apiVersion || "2025-01";

  let wedhooksSettings = await request.formData();
  wedhooksSettings = Object.fromEntries(wedhooksSettings);

  console.log("Webhook settings:", wedhooksSettings);
  const res = await fetch(
    `https://${shopDomain}/admin/api/${version}/webhooks.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: JSON.stringify({
        webhook: {
          topic: wedhooksSettings.topic,
          address: wedhooksSettings.address,
          format: "json",
        },
      }),
    }
  );

  const shopifyWebhook = await res.json();

  console.log("Created webhook:", shopifyWebhook);
  console.log("Created webhook:", shopifyWebhook.errors);


  if (shopifyWebhook.errors) {
    return json({ success: false, error: shopifyWebhook.errors }, { status: 400 });
  }

  return json({ success: true, shopifyWebhook });
}

export default function WebhooksPage() {

  const actionData = useActionData();
  const wedhooks = useLoaderData();
  const [formState, setFormState] = useState(wedhooks);

  const { smUp } = useBreakpoints();
  return (
    <Page>
      <TitleBar title="Settings" />
      <BlockStack gap={{ xs: "800", sm: "400" }}>
        {actionData?.success && (
          <Banner status="success" title="Settings saved successfully!" />
        )}
        {actionData?.success === false && (
          <Banner status="critical" title={actionData.error.address[0]} />
        )}
        <InlineGrid columns={{ xs: "1fr", md: "2fr 5fr" }} gap="400">
          <Box
            as="section"
            paddingInlineStart={{ xs: 400, sm: 0 }}
            paddingInlineEnd={{ xs: 400, sm: 0 }}
          >
            <BlockStack gap="400">
              <Text as="h3" variant="headingMd">
                Setting Wedhooks
              </Text>
            </BlockStack>
          </Box>
          <Card roundedAbove="sm">
            <Form method="POST">
              <BlockStack gap="400">
                <TextField label="Topic" name="topic" value={formState?.topic} onChange={(value) => setFormState({ ...formState, topic: value })} />
                <TextField label="Address" name="address" value={formState?.address} onChange={(value) => setFormState({ ...formState, address: value })} />
                <Button submit={true}>
                  Save
                </Button>
              </BlockStack>
            </Form>
          </Card>
        </InlineGrid>
        {smUp ? <Divider /> : null}
      </BlockStack>
    </Page>
  );
}

function Code({ children }) {
  return (
    <Box
      as="span"
      padding="025"
      paddingInlineStart="100"
      paddingInlineEnd="100"
      background="bg-surface-active"
      borderWidth="025"
      borderColor="border"
      borderRadius="100"
    >
      <code>{children}</code>
    </Box>
  );
}
