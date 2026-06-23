import { IonLabel } from '@ionic/react';

const Label = ({ text, color, className = '' }) => (
    <IonLabel color={color} className={className}>
        {text}
    </IonLabel>
);

export default Label;
