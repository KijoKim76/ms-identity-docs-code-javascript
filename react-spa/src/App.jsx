import React, { useState } from 'react';

import { PageLayout } from './components/PageLayout';
import { edgeAuthZRequest, loginRequest} from './authConfig';
import { callEdgefieldAPI, callMsGraph } from './graph';
import { ProfileData } from './components/ProfileData';


import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from '@azure/msal-react';
import './App.css';
import Button from 'react-bootstrap/Button';

/**
 * Renders information about the signed-in user or a button to retrieve data about the user
 */

const ProfileContent = () => {
    const { instance, accounts } = useMsal();
    const [graphData, setGraphData] = useState(null);
    const [authZData, saveResponse] = useState(null);

    function RequestProfileData() {
        
        //reset data
        saveResponse(null);

        // Silently acquires an access token which is then attached to a request for MS Graph data
        instance
            .acquireTokenSilent({
                ...loginRequest,
                account: accounts[0],
            })
            .then((response) => {
                callMsGraph(response.accessToken).then((response) => setGraphData(response));
            });
    }
    
    function RequestEdgeField() {

        setGraphData(null);
        
        // Silently acquires an access token which is then attached to a request for Edgefield APIM
        instance
            .acquireTokenSilent({
                ...edgeAuthZRequest,
                account: accounts[0],
            })
            .then((response) => {                
                console.log(response.accessToken);
                callEdgefieldAPI(response.accessToken).then((response) => saveResponse(response));
            });
    }

    return (
        <>
            <h5 className="profileContent">Welcome {accounts[0].name}</h5>
            {graphData ? (
                <ProfileData graphData={graphData} />
            ) : (
                <>                
                <h6 className="card-title">AuthN needed </h6>  
                <Button variant="secondary" onClick={RequestProfileData}>
                    Request Profile
                </Button>
                </>
            )}         

            <p/>

            {authZData ? (   
                <div className='dataContent'>
                    <textarea 
                        value={JSON.stringify(authZData, null, 2)} 
                        readOnly 
                        rows={10} 
                        cols={200} 
                        style={{ width: '100%', height: 'auto' }} 
                    />
                </div>
            ) : (          
                <>                
                <h6 className="card-title">AuthZ needed</h6>    
                <Button variant="primary" onClick={RequestEdgeField}>
                    Edgefield Access Permission Check
                </Button>
                </>
            )}
        </>
    );
};

/**
 * If a user is authenticated the ProfileContent component above is rendered. Otherwise a message indicating a user is not authenticated is rendered.
 */
const MainContent = () => {
    return (
        <div className="App">
            <AuthenticatedTemplate>
                <ProfileContent />
            </AuthenticatedTemplate>

            <UnauthenticatedTemplate>
                <h5 className="card-title">Please sign-in to see your profile information.</h5>
            </UnauthenticatedTemplate>
        </div>
    );
};

export default function App() {
    return (
        <PageLayout>
            <MainContent />
        </PageLayout>
    );
}
