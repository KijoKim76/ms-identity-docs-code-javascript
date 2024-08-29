@description('Location for all resources.')
param location string = resourceGroup().location

@description('The name of the API Management service instance')
param apiMgmtName string

@description('The email address of the owner of the service')
@minLength(1)
param publisherEmail string

@description('The name of the owner of the service')
@minLength(1)
param publisherName string

@description('The pricing tier of this API Management service')
@allowed([
  'Consumption'
  'Developer'
  'Basic'
  'Standard'
  'Premium'
])
param sku string = 'Developer'

@description('The instance size of this API Management service.')
@allowed([
  0
  1
  2
])
param skuCount int = 1

@description('Tags for the API Management service')
param tags object = {}

@description('The name of the API')
param apiName string = 'test-token-validation'

@description('The name of the API')
param apiDisplayName string = 'Test token validation'

var dummyBackendUrl = 'https://httpbin.org/'
var apiPath = 'api'
// Policy for the API that uses the policy fragment
var apiLevelPolicyXml = '''
<policies>
  <!-- Throttle, authorize, validate, cache, or transform the requests -->
  <inbound>
    <base />
    <include-fragment fragment-id="EnableCORS" />
    <include-fragment fragment-id="ValidateEntraIdToken" />
  </inbound>
  <!-- Control if and how the requests are forwarded to services  -->
  <backend>
    <base />
  </backend>
  <!-- Customize the responses -->
  <outbound>
    <base />
  </outbound>
  <!-- Handle exceptions and customize error responses  -->
  <on-error>
    <base />
  </on-error>
</policies>
'''


// API MGMT Service
resource apiMgmt 'Microsoft.ApiManagement/service@2021-08-01' = {
  name: apiMgmtName
  location: location
  tags: tags
  sku: {
    name: sku
    capacity: skuCount
  }
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    publisherEmail: publisherEmail
    publisherName: publisherName
  }
}

// Policy fragments
resource validateEntraIdTokenPolicy 'Microsoft.ApiManagement/service/policyFragments@2023-05-01-preview' = {
  name: 'ValidateEntraIdToken'
  parent: apiMgmt
  properties: {
    description: 'Validate Entra ID token and get OID and TID'
    format: 'rawxml'
    value: loadTextContent('./apim-policy-fragments/validate-entraid-token.xml')
  }
}

resource corsPolicy 'Microsoft.ApiManagement/service/policyFragments@2023-05-01-preview' = {
  name: 'EnableCORS'
  parent: apiMgmt
  properties: {
    description: 'Enable CORS'
    format: 'rawxml'
    value: loadTextContent('./apim-policy-fragments/cors.xml')
  }
}

// API
resource testApi 'Microsoft.ApiManagement/service/apis@2022-08-01' = {
  name: apiName
  parent: apiMgmt
  dependsOn: [
    validateEntraIdTokenPolicy
  ]
  properties: {
    displayName: apiDisplayName
    apiRevision: '1'
    subscriptionRequired: false
    serviceUrl: dummyBackendUrl
    path: apiPath
    protocols: [
      'https'
    ]
    isCurrent: true
  }
}

/* API Level policies that all API operations will inherit */
resource epsoCopilotApiLevelPolicies 'Microsoft.ApiManagement/service/apis/policies@2022-08-01' = {
  name: 'policy'
  parent: testApi
  properties: {
    format: 'rawxml'
    value: apiLevelPolicyXml
  }
}

/* API Operations */
// GET /
resource getRoot 'Microsoft.ApiManagement/service/apis/operations@2022-08-01' = {
  name: 'getroot'
  parent: testApi
  properties: {
    displayName: 'Get Root'
    method: 'GET'
    urlTemplate: '/'
    description: 'Get Root'
  }
}
resource getRootPolicy 'Microsoft.ApiManagement/service/apis/operations/policies@2022-08-01' = {
  name: 'policy'
  parent: getRoot
  properties: {
    format: 'rawxml'
    value: apiLevelPolicyXml
  }
}
