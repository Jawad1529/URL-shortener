import { IonIcon } from '@ionic/react';

const Icon = ({ icon, size, color, onClick }) => (
    <IonIcon
        icon={icon}
        size={size}
        color={color}
        onClick={onClick}
        className={onClick ? 'cursor-pointer hover:opacity-70 transition-opacity' : ''}
    />
);

export default Icon;
