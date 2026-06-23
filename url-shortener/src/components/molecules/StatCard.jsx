import { IonCard, IonCardContent } from '@ionic/react';

const StatCard = ({ title, value, color = 'primary' }) => (
    <IonCard className="text-center m-2">
        <IonCardContent>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{title}</p>
            <p className={`text-2xl font-bold ion-color-${color}`}>{value}</p>
        </IonCardContent>
    </IonCard>
);

export default StatCard;
