import { ReactNode } from 'react';
import WebGL from './WebGL';

const WebGLLayout = ({ children }: { children?: ReactNode }) => {
    return (
        <>
            <WebGL />
            {children}
        </>
    );
};

export default WebGLLayout;
