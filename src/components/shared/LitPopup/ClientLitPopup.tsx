import dynamic from 'next/dynamic';
import { LitPopupProps } from './types';

const LitPopup = dynamic(() => import('./LitPopup'), { ssr: false });

const ClientLitPopup = (props: LitPopupProps) => {
    return <LitPopup {...props} />;
};

export default ClientLitPopup;
