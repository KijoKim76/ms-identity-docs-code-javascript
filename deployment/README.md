# Edgefield Auth V2 Sample

---

# 1. Create and configure an Entra ID App registration to represent your application

## Create an App registration
You need to create an Entra ID App Registration that represents the application for users to authenticate and authorize.

1. Sign in to Entra ID Admin Center: https://entra.microsoft.com/#home.
1. Go to **Identity** > **Applications** > App registrations, select **New registration**.
1. Enter a Name (e.g. `auth-v2-sample`) for your application. Users of your app might see this name, and you can change it later.
1. For **Supported account types**, select *Accounts in any organizational directory (Any Microsoft Entra ID tenant - Multitenant) and personal Microsoft accounts (e.g. Skype, Xbox)* to allow both work/school account and MSA to sign in.
1. Do **NOT** enter a Redirect URI. We will fill those in later.
1. For **Service Tree ID (Optional)**, enter `be178f00-3d91-4a9e-9f55-46078287be40` which is our [Azure CPE Subscriptions](https://microsoftservicetree.com/services/be178f00-3d91-4a9e-9f55-46078287be40) service ID. This is required due to SFI.
1. Click **Register**.


## Set up Redirect URIs

Once the App Registration is created, you need to further configure it so it can be used by this sample.

1. After the previous step, you should be redirected to the app detail page. If not, go to [Entra ID Admin Center](https://entra.microsoft.com/#home), go to **Identity** > **Applications** > **App registration** and select the your app.
1. Under **Manage**, select **Authentication** > **Add a platform**
1. Under **Web applications**, select the **Single-page application** tile.
1. Under **Redirect URIs**, enter `http://localhost:3000`. It's `localhost` because you will be running the frontend locally. In production, this should be the FQDN of the frontend.
1. Do **NOT** select either checkbox under Implicit grant and hybrid flows.
1. Select **Configure** to finish adding the redirect URI.

## Expose an API to represent the backend of the App registration

Since we're only using one single App registration to represent our UI frontend (for user sign-in) and backend API, we need to expose an API to represent the backend API so the frontend code can request an access token to access our backend API.

1. Sign in to [Entra ID Admin Center](https://entra.microsoft.com/#home) and navigate to your app registration
1. In **Overview**, write down the value of **Application (client) ID** field as we will need it later. This is the *App ID* of your App registration.
1. Under **Manage**, select **Expose and API**.
1. On the top of the page, select the **Add** right next to **Application ID URI** to register an App ID URI.
1. Select **Save** to use the default App ID URI which is in the form of `api://<App ID>`. You should now see the App ID URI appeared right next to **Application ID URI**.
1. Under **Scopes defined by this API**, select **Add a scope**
1. Enter the following information:
   - Scope name: `TokenValidation`
   - Who can consent: `Admins and users`
   - Admin consent display name: `TokenValidation`
   - Admin consent description: `TokenValidation`
   - State: `Enabled`
1. Select **Add scope**.
1. Under **Authorized client applications**, select **Add a client application**.
1. Copy-paste the value of **Application (client) ID** into the **Client ID** field and select the only available Authorized scope which should be in the form of `api://<App ID>/TokenValidation`. This means we want to pre-authorized the app itself to request an access token for its API without user's consent.
1. Select **Add application**.

# 2. Deploy API Management

## Update validate-entraid-token policy fragment

The [`validate-azure-ad-token`](https://learn.microsoft.com/en-us/azure/api-management/validate-azure-ad-token-policy)
needs your App registration information to perform validation.

1. Use your code editor to open [`apim-policies/validate-entraid-token.xml`](./apim-policies/validate-entraid-token.xml)
1. Replace `__APP_ID_URI__` with the **Application ID URI** of your App registration (the one starts with `api://`). in the **Expose an API** tab. For example:
   ```
   ...
   <audiences>
         <audience>api://6ec6ab9e-137d-4e13-a3ea-000000000000</audience>
   </audiences>
   ...
   ```
1. Replace `__APP_ID__` with the **Application ID** of your App registration. For example:
   ```
   ...
   <backend-application-ids>
         <application-id>6ec6ab9e-137d-4e13-a3ea-000000000000</application-id>
   </backend-application-ids>
   ...
   ```

## Create the API Management and its sub resources using deploy.bicep

You can now use the [`deploy.bicep`](./deploy.bicep) to deploy the following resources:
- API Management with Developer SKU
- Policy fragment to perform Entra ID token validation [`validate-entraid-tokenxml`](./apim-policy-fragments/validate-entraid-token.xml)
- Policy fragment to enable CORS [`cors.xml`](./apim-policy-fragments/cors.xml)
- An API with path `api`
- An API Operation that allows `HTTP GET /`

1. Update [`deploy.bicepparam`](./deploy.bicepparam) with your information.
   > **NOTE**: If you already have an API Management service, you can put the name of it in the `apiMgmtName` parameter.
   > ARM will reuse your API Management to create all the required sub-resources.
   > However, if your API Management's SKU is not `Developer`, make sure you change the `sku` parameter to the SKU you have.
   > Otherwise you would have to wait for another 30-40 minutes for the SKU upgrade/downgrade, or the deployment will fail if you have `Consumption` SKU
   > because `Consumption` cannot be upgraded to other SKUs.

1. Use the following command to deploy the resources:
   ```bash
   az deployment group create -g <Your Resource Group> -f ./deploy.bicep -p ./deploy.bicepparam
   ```

> **NOTE**: The policy fragment `validate-entraid-token` does **NOT** forward the request to the backend
> due to the `<return-response>` policy at the end. Instead, API Management returns the response with
> the extracted `oid` and `tid` attached to the response headers.

## Test your API Management

1. Sign in to [Azure Portal](https://portal.azure.com) and navigate to the newly created API Management service
1. Under **APIs**, select **APIs**.
1. Under **All APIs**, you should see a new API being added: **Test token validation**. Click it to select it.
1. Go to the **Test** tab, select the API operation **Get Root**, and click **Send** at the bottom.
1. You should see the **HTTP response** shows `401 Unauthorized`. This is normal because the test call does not carry any access token.
1. You can use `curl` or other HTTP request testing tools to test the following URL. You should also get the same HTTP response:
   ```
   GET https://<Your API Management Name>.azure-api.net/api/
   ```

   For example, test my our API Management with `curl` will get:
   ```
   $ curl https://john-dev-apimgmt.azure-api.net/api/

   {"statusCode": 401, "message": "Tenant identifier is missing"}
   ```

# 3. Test the API with the sample frontend

Once your API Management is ready, you can start the sample frontend to test the validation policy.

> **NOTE**: The sample frontend is based on this: https://github.com/Azure-Samples/ms-identity-docs-code-javascript/tree/main/react-spa

1. Make sure you have Node.js and NPM installed.
1. Update [`frontend/src/authConfig.js`](./frontend/src/authConfig.js):
   - `msalConfig.auth.clientId`: App ID of your App registration
   - `apiMgmtConfig.endpoint`: The API Management *Get Root* opration API. For example: `https://my-apimgmt.azure-api.net/api/`
1. Change directory into `frontend/` and run `npm install` and `npm start` to start the frontend. Make sure it's running on `http://localhost:3000`.
1. Click the **Sign In** at the top-right corner and sign in with your @microsoft.com or your personal MSA.
1. Once you see the *Welcome \<Your Name\>* page, click the **Send request to API Management**.
1. If everything works, you should now see your `oid` and `tid` that API Management extracted from the access token:
   ![success.png](./docs/media/success.png)

# 4. Sample policy fragment: Retrieve data from Cosmos DB

I've created the policy fragment that is used to query a Cosmos DB using `oid` and `tid`: [`query-cosmosdb.xml`](./apim-policy-fragments/query-cosmosdb.xml).
