import React, { useRef, useEffect } from 'react';
import Peer from 'simple-peer';

const VideoPlayer = ({ peer }) => {
    const ref = useRef();

    useEffect(() => {
        peer.on('stream', stream => {
            ref.current.srcObject = stream;
        });
    }, [peer]);

    return (
        <video playsInline autoPlay ref={ref} />
    );
};

export default VideoPlayer;