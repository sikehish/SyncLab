import React, { useEffect } from 'react';
import RFB from "./noVNC/core/rfb";

const VNCViewer = ({ vncPort }) => {
    useEffect(() => {
        const webSocketUrl = `ws://localhost:${vncPort}/websockify`;

        const rfb = new RFB(document.getElementById('vnc-container'), webSocketUrl);
        console.log(rfb)
        rfb.addEventListener('connect', () => {
            console.log('Connected to VNC server');
        });
        rfb.addEventListener('disconnect', () => {
            console.log('Disconnected from VNC server');
        });
        rfb.addEventListener('credentialsrequired', () => {
            console.log('credentialsrequired from VNC server');
        });
        rfb.addEventListener('securityfailure', (event) => {
            console.error('Security failure:', event);
        });

        // Cleanup on component unmount
        return () => {
            rfb.disconnect();
        };
    }, [vncPort]);

    return (
        <div>
            <div id="vnc-container" style={{ width: '100%', height: '100vh' }}></div>
        </div>
    );
};

export default VNCViewer;
