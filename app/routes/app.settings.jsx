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

import prisma from "../db.server";

export async function loader() {
  // get the app name and description from the database
  let systemSettings = await prisma.systemSettings.findFirst();
  console.log('settings' ,systemSettings);
  return systemSettings; // return trực tiếp settings thay vì { settings }
}

export async function action({ request }) {
  // updates persistent data
  let systemSettings = await request.formData();
  systemSettings = Object.fromEntries(systemSettings);

  await prisma.systemSettings.upsert({
    where: { id: 1 },
    update: {
      system_key: systemSettings.system_key,
      system_domain: systemSettings.system_domain
    },
    create: {
      id: 1,
      system_key: systemSettings.system_key,
      system_domain: systemSettings.system_domain,
      access_token: "" // Mặc định access_token là chuỗi rỗng khi tạo mới
    },
  });

  console.log(systemSettings);
  return json({ success: true, systemSettings });
}

export default function SettingsPage() {
  const actionData = useActionData();
  const settings = useLoaderData();
  const [formState, setFormState] = useState(settings);

  const { smUp } = useBreakpoints();
  return (
    <Page>
      <TitleBar title="Settings" />
      <BlockStack gap={{ xs: "800", sm: "400" }}>
        {actionData?.success && (
          <Banner status="success" title="Settings saved successfully!" />
        )}
        <InlineGrid columns={{ xs: "1fr", md: "2fr 5fr" }} gap="400">
          <Box
            as="section"
            paddingInlineStart={{ xs: 400, sm: 0 }}
            paddingInlineEnd={{ xs: 400, sm: 0 }}
          >
            <BlockStack gap="400">
              <Text as="h3" variant="headingMd">
                Settings
              </Text>
            </BlockStack>
          </Box>
          <Card roundedAbove="sm">
            <Form method="POST">
              <BlockStack gap="400">
                <TextField label="System Key" name="system_key" value={formState?.system_key} onChange={(value) => setFormState({ ...formState, system_key: value })} />
                <TextField label="System Domain" name="system_domain" value={formState?.system_domain} onChange={(value) => setFormState({ ...formState, system_domain: value })} />
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
