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

    // return fetch(graphConfig.graphMeEndpoint, options)
    //     .then(response => response.json())
    //     .catch(error => console.log(error));

    fetch(graphConfig.graphMeEndpoint, options)
    .then(response => {
        // Log the response headers
        console.log('Response Headers:');
        response.headers.forEach((value, key) => {
            console.log(`${key}: ${value}`);
        });

        return response.json();

    })
    .catch(error => {
        console.log(error);
    });      
    


}


/**
 * Attaches a given access token to a Edgefield APIM API call. Returns information about the user
 * @param accessToken 
 */
export async function callEdgefieldAPI(accessToken) {
    const headers = new Headers();
    const bearer = `Bearer ${accessToken}`;

    headers.append("Authorization", bearer);
    //headers.append("Host", "aipm-epso-authtest01.azure-api.net");
    //headers.append("Ocp-Apim-Subscription-Key", "2e02b96366324e4e8c7cf58e0b0c7a27");
    headers.append("Access-Control-Allow-Origin", "http://localhost:3000");
    

    const options = {
        method: "GET",
        headers: headers
    };

    // Log the request headers
    console.log('Request Headers:');
    headers.forEach((value, key) => {
        console.log(`${key}: ${value}`);
    });

    
    // return fetch(edgeAuthZConfig.resourceEndpoint, options)
    //     .then(response => response.json())
    //     .catch(error => console.log(error));
    console.log('Resource Endpoint:', edgeAuthZConfig.resourceEndpoint)
    fetch(edgeAuthZConfig.resourceEndpoint, options)
        .then(response => {
            // Log the response headers
            console.log('Response Headers:');
            response.headers.forEach((value, key) => {
                console.log(`${key}: ${value}`);
            });

            return response;
        })
        .catch(error => {
            console.log(error);
        });        

}
