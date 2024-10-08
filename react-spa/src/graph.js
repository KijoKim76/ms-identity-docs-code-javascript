import { edgeAuthZConfig, graphConfig } from "./authConfig";
/**
 * Attaches a given access token to a MS Graph API call. Returns information about the user
 * @param accessToken 
 */
export async function callMsGraph(accessToken) {
    const headers = new Headers();
    const bearer = `Bearer ${accessToken}`;

    headers.append("Authorization", bearer);

    const options = {
        method: "GET",
        headers: headers
    };

    
    return fetch(graphConfig.graphMeEndpoint, options)
        .then(response => response.json())
        .catch(error => console.log(error));
        
}


/**
 * Attaches a given access token to a Edgefield APIM API call. Returns information about the user
 * @param accessToken 
 */
export async function callEdgefieldAPI(accessToken) {
    const headers = new Headers();
    const bearer = `Bearer ${accessToken}`;

    headers.append("Authorization", bearer);;
    
    const options = {
        method: "GET",
        headers: headers
    };

    // Log the request headers
    console.log('Request Headers:');
    headers.forEach((value, key) => {
        console.log(`${key}: ${value}`);
    });

    
    return fetch(edgeAuthZConfig.resourceEndpoint, options)
        .then(response => response.json())
        .catch(error => console.log(error));

}
